from flask import Flask, request, jsonify
import subprocess
import hmac
import hashlib
import os

app = Flask(__name__)

WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-secret-here')
PROJECT_PATH = '/path/to/your/project'

def verify_signature(payload_body, signature_header):
    """Verify GitHub webhook signature"""
    if not signature_header:
        return False
    
    sha_name, signature = signature_header.split('=')
    if sha_name != 'sha256':
        return False
    
    mac = hmac.new(WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)

@app.route('/webhook', methods=['POST'])
def github_webhook():
    signature = request.headers.get('X-Hub-Signature-256')
    
    if not verify_signature(request.data, signature):
        return jsonify({'error': 'Invalid signature'}), 403
    
    payload = request.json
    
    # Check if this is a push to main branch
    if (payload.get('ref') == 'refs/heads/main' and 
        payload.get('repository', {}).get('name') == 'your-repo-name'):
        
        try:
            # Pull latest code
            subprocess.run(['git', 'pull'], cwd=PROJECT_PATH, check=True)
            
            # Rebuild and restart containers
            subprocess.run(['docker-compose', 'down'], cwd=PROJECT_PATH, check=True)
            subprocess.run(['docker-compose', 'build', '--no-cache'], cwd=PROJECT_PATH, check=True)
            subprocess.run(['docker-compose', 'up', '-d'], cwd=PROJECT_PATH, check=True)
            
            return jsonify({'status': 'success', 'message': 'Deployment completed'})
            
        except subprocess.CalledProcessError as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    return jsonify({'status': 'ignored', 'message': 'Not a main branch push'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
