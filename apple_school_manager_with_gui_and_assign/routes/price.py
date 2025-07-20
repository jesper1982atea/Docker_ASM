# Endpoint för att hämta alla prislistor (namn på filer)
from flask import Blueprint
from flask_restx import Namespace, Resource
from flask import request
import os, json
import math
from flask import jsonify
from flask_restx import reqparse

price_ns = Namespace('Apple Pricelist', description='Apple Price List Data Endpoints')



@price_ns.route('/get/pricelist')
class PriceListNames(Resource):
    def get(self):
        files = [f for f in os.listdir(PROCESSED_PRICE_DIR) if f.endswith('.json')]
        return jsonify(files)
# ...befintlig kod...

from flask_restx import Namespace, Resource
from flask import request, jsonify
import os, json, math


PROCESSED_PRICE_DIR = os.path.join(os.path.dirname(__file__), '..', 'price_uploads', 'processed')
DISCOUNTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'admin_api', 'discounts')

def load_discount_program(program_name):
    filename = program_name if program_name.endswith('.json') else program_name + '.json'
    path = os.path.join(DISCOUNTS_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

@price_ns.route('/list')
class PriceList(Resource):
    def get(self):
        files = [f for f in os.listdir(PROCESSED_PRICE_DIR) if f.endswith('.json')]
        return files

@price_ns.route('/data/<string:filename>')
class PriceData(Resource):
    def get(self, filename):
        path = os.path.join(PROCESSED_PRICE_DIR, filename)
        if not os.path.exists(path):
            return {"error": "Not found"}, 404
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data


@price_ns.route('/price-lookup/<path:price_list>/<path:part_number>')
class PriceListLookup(Resource):
    def get(self, price_list, part_number):
        # Sökväg till prislistan
        price_dir = os.path.join(os.path.dirname(__file__), '..', 'price_uploads', 'processed')
        price_file = os.path.join(price_dir, price_list)
        if not os.path.exists(price_file):
            return {"error": f"Price list '{price_list}' not found."}, 404
        with open(price_file, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except Exception as e:
                return {"error": f"Could not read price list: {e}"}, 500
        # Leta efter exakt match på 'Part Number'
        part_number_upper = part_number.upper()
        part_number_base = part_number_upper.split('/')[0]
        # Exakt match
        for row in data:
            pn = row.get('Part Number', '').upper()
            if pn == part_number_upper or pn == part_number_base:
                return row
        # Prefix-match (t.ex. MC654KS i MC654KS/A eller tvärtom)
        for row in data:
            pn = row.get('Part Number', '').upper()
            pn_base = pn.split('/')[0]
            if pn.startswith(part_number_base) or part_number_base.startswith(pn) or pn_base == part_number_base:
                return row
        return {"error": f"Part Number '{part_number}' not found in price list '{price_list}'."}, 404

# Swagger-dokumentation av förväntade fält
calculate_parser = price_ns.parser()
calculate_parser.add_argument('inkopspris', type=float, required=True, help='Inköpspris exkl. moms')
calculate_parser.add_argument('restvarde', type=float, required=True, help='Restvärde i procent (t.ex. 25)')
calculate_parser.add_argument('alp_price', type=float, required=False, help='ALPPrice / Listpris exkl. moms')

calculate_parser.add_argument('kontant_marginal_procent', type=float, required=True, help='Marginal i procent för kontantköp')
calculate_parser.add_argument('leasing_marginal_procent', type=float, required=True, help='Marginal i procent för leasing')
calculate_parser.add_argument('cirkular_marginal_procent', type=float, required=True, help='Marginal i procent för cirkulärt')

@price_ns.route('/calculate')
class PriceCalculate(Resource):
    @price_ns.expect(calculate_parser)
    def post(self):
        args = calculate_parser.parse_args()

        inkopspris = float(args['inkopspris'])
        restvarde_input = float(args['restvarde'])
        alp_price = args.get('alp_price')

        kontant_margin_pct = float(args['kontant_marginal_procent'])
        leasing_margin_pct = float(args['leasing_marginal_procent'])
        circular_margin_pct = float(args['cirkular_marginal_procent'])

        # -- KONTANT --
        kontant_fors_pris = inkopspris * (1 + kontant_margin_pct / 100)
        kontant_marginal = kontant_fors_pris - inkopspris
        kontant_marginal_pct = (kontant_marginal / kontant_fors_pris * 100) if kontant_fors_pris else 0

        kontant = {
            "forsaljningspris": round(kontant_fors_pris, 2),
            "inköpspris": float(args['inkopspris']),
            "marginal": round(kontant_marginal, 2),
            "marginal_procent": round(kontant_marginal_pct, 2),
            "info": "Försäljningspris = inköpspris + marginal. Restvärde visas som möjligt inbytesvärde."
        }

        # -- LEASING --
        leasing_fors_pris = inkopspris * (1 + leasing_margin_pct / 100)

        if 0 < restvarde_input <= 1:
            leasing_restvarde = restvarde_input * leasing_fors_pris
        elif 1 < restvarde_input <= 100:
            leasing_restvarde = (restvarde_input / 100) * leasing_fors_pris
        else:
            leasing_restvarde = 0.0

        leasing_marginal = leasing_fors_pris - inkopspris
        leasing_marginal_pct = (leasing_marginal / leasing_fors_pris * 100) if leasing_fors_pris else 0
        finansierat_belopp = leasing_fors_pris - leasing_restvarde

        leasing = {}
        for months in [24, 36, 48]:
            leasing[str(months)] = {
                "manadskostnad": round(finansierat_belopp / months, 2),
                "finansierat_belopp": round(finansierat_belopp, 2),
                "inköpspris": float(args['inkopspris']),
                "restvarde": round(leasing_restvarde, 2),
                "marginal": round(leasing_marginal, 2),
                "marginal_procent": round(leasing_marginal_pct, 2)
            }

        # -- CIRKULÄRT --
        if alp_price is None:
            alp_price = leasing_fors_pris  # fallback

        alp_price = float(alp_price)
        circular_fors_pris = alp_price * (1 + circular_margin_pct / 100)
        circular_marginal = circular_fors_pris - inkopspris
        circular_marginal_pct = (circular_marginal / circular_fors_pris * 100) if circular_fors_pris else 0

        if 0 < restvarde_input <= 1:
            circular_restvarde = restvarde_input * circular_fors_pris
        elif 1 < restvarde_input <= 100:
            circular_restvarde = (restvarde_input / 100) * circular_fors_pris
        else:
            circular_restvarde = 0.0

        faktura_1 = circular_fors_pris - circular_restvarde
        faktura_2 = circular_restvarde

        circular = {
            "faktura_1": round(faktura_1, 2),
            "faktura_2": round(faktura_2, 2),
            "inköpspris": float(args['inkopspris']),
            "marginal": round(circular_marginal, 2),
            "marginal_procent": round(circular_marginal_pct, 2),
            "info": "Faktura 1 = ALP + marginal - restvärde. Faktura 2 = restvärde. Marginal = försäljningspris - inköpspris."
        }

        return jsonify({
            "kontant": kontant,
            "leasing": leasing,
            "circular": circular
        })

# calculate_parser = reqparse.RequestParser()
# calculate_parser.add_argument('inkopspris', type=float, required=True, help='Inköpspris')
# calculate_parser.add_argument('restvarde', type=float, required=False, default=0.0, help='Restvärde')
# calculate_parser.add_argument('alp_price', type=float, required=False, help='ALPPrice (listpris utan rabatt)')
# calculate_parser.add_argument('marginal_procent', type=float, required=False, help='Önskad marginal i procent')

# calculate_parser = reqparse.RequestParser()
# calculate_parser.add_argument('inkopspris', type=float, required=True, help='Inköpspris')
# calculate_parser.add_argument('restvarde', type=float, required=False, default=0.0, help='Restvärde i % (t.ex. 25 för 25%)')
# calculate_parser.add_argument('alp_price', type=float, required=False, help='ALPPrice (listpris utan rabatt)')
# calculate_parser.add_argument('marginal_procent', type=float, required=True, help='Önskad marginal i procent')

# @price_ns.route('/calculate')
# class PriceCalculate(Resource):
#     @price_ns.expect(calculate_parser)
#     def post(self):
#         args = calculate_parser.parse_args()
#         inkopspris = args['inkopspris']
#         restvarde_input = args['restvarde']
#         alp_price = args.get('alp_price')
#         marginal_procent_input = args['marginal_procent']

#         # Beräkna försäljningspris
#         fors_pris = inkopspris * (1 + marginal_procent_input / 100)

#         # Tolkning av restvärde (som procent av försäljningspris)
#         if 0 < restvarde_input <= 1:
#             restvarde = restvarde_input * fors_pris
#         elif 1 < restvarde_input <= 100:
#             restvarde = (restvarde_input / 100) * fors_pris
#         else:
#             restvarde = 0.0

#         # Marginal
#         marginal = fors_pris - inkopspris
#         marginal_procent = (marginal / fors_pris) * 100 if fors_pris else 0

#         # Kontantköp
#         kontant = {
#             "forsaljningspris": round(fors_pris, 2),
#             "marginal": round(marginal, 2),
#             "marginal_procent": round(marginal_procent, 2),
#             "info": "Försäljningspris = inköpspris + marginal. Restvärde informeras om som eventuellt återköpsvärde."
#         }

#         # Leasing
#         finansierat_belopp = fors_pris - restvarde
#         leasing = {}
#         for months in [24, 36, 48]:
#             manadskostnad = finansierat_belopp / months
#             leasing[str(months)] = {
#                 "manadskostnad": round(manadskostnad, 2),
#                 "finansierat_belopp": round(finansierat_belopp, 2),
#                 "restvarde": round(restvarde, 2),
#                 "marginal": round(marginal, 2),
#                 "marginal_procent": round(marginal_procent, 2),
#                 "info": "Leasingbelopp = försäljningspris - restvärde, fördelat per månad."
#             }

#         # Cirkulärt upplägg
#         if alp_price is None:
#             alp_price = fors_pris

#         faktura_1 = alp_price - restvarde
#         circular_margin = alp_price - inkopspris
#         circular_margin_procent = (circular_margin / alp_price) * 100 if alp_price else 0

#         circular = {
#             "faktura_1": round(faktura_1, 2),
#             "faktura_2": round(restvarde, 2),
#             "marginal": round(circular_margin, 2),
#             "marginal_procent": round(circular_margin_procent, 2),
#             "info": "Faktura 1 = ALPPrice minus restvärde. Faktura 2 = restvärdet. Marginal = ALPPrice - inköpspris."
#         }

#         return jsonify({
#             "kontant": kontant,
#             "leasing": leasing,
#             "circular": circular
#         })

# calculate_parser = reqparse.RequestParser()
# calculate_parser.add_argument('inkopspris', type=float, required=True, help='Inköpspris')
# calculate_parser.add_argument('forsaljningspris', type=float, required=True, help='Försäljningspris')
# calculate_parser.add_argument('restvarde', type=float, required=True, help='Restvärde')
# calculate_parser.add_argument('alp_price', type=float, required=False, help='ALPPrice (listpris utan rabatt)')

# @price_ns.route('/calculate')
# class PriceCalculate(Resource):
#     @price_ns.expect(calculate_parser)
#     def post(self):
#         args = calculate_parser.parse_args()
#         inkopspris = float(args.get('inkopspris', 0))
#         fors_pris = float(args.get('forsaljningspris', 0))
#         restvarde = float(args.get('restvarde', 0))
#         alp_price = args.get('alp_price', None)
#         alp_price = float(alp_price) if alp_price is not None else fors_pris

#         # Marginal för vanliga köp/leasing (på försäljningspris)
#         marginal = fors_pris - inkopspris
#         marginal_procent = ((fors_pris - inkopspris) / fors_pris * 100) if fors_pris else 0

#         # Leasingkostnader (baserat på försäljningspris)
#         leasing = {}
#         for months in [24, 36, 48]:
#             finansierat_belopp = fors_pris - restvarde
#             manadskostnad = finansierat_belopp / months if months > 0 else 0
#             leasing[str(months)] = {
#                 "manadskostnad": round(manadskostnad, 2),
#                 "finansierat_belopp": round(finansierat_belopp, 2),
#                 "restvarde": round(restvarde, 2),
#                 "marginal": round(marginal, 2),
#                 "marginal_procent": round(marginal_procent, 2)
#             }

#         # Cirkulärt upplägg (påslag på ALPPrice, dra av restvärde, marginal mot inköpspris)
#         # Påslag = (ALPPrice * (fors_pris / fors_pris)) om ingen rabatt, annars (fors_pris - ALPPrice) är påslaget
#         # Men här används ALPPrice + marginalpåslag (dvs. fors_pris) - restvärde
#         circular_customer_price = alp_price - restvarde  # Kundens pris: ALPPrice - restvärde
#         circular_margin = (alp_price - restvarde) - inkopspris  # Marginal: (ALPPrice - restvärde) - inköpspris
#         circular_margin_percent = ((circular_margin / (alp_price - restvarde)) * 100) if (alp_price - restvarde) else 0

#         circular = {
#             "faktura_1": round(circular_customer_price, 2),
#             "faktura_2": round(restvarde, 2),
#             "marginal": round(circular_margin, 2),
#             "marginal_procent": round(circular_margin_percent, 2),
#             "info": "Faktura 1: ALPPrice minus restvärde. Faktura 2: endast restvärde. Marginalen räknas på (ALPPrice - restvärde) minus inköpspris."
#         }

#         return jsonify({
#             "leasing": leasing,
#             "circular": circular
#         })

