import DiscountDropdown from './js/render-discount-dropdown.js';

<h3>Discount Dropdown Example</h3>

function MyComponent() {
  const [selectedProgram, setSelectedProgram] = useState('');

  return (
    <div>
      <DiscountDropdown
        selected={selectedProgram}
        onChange={setSelectedProgram}
      />
      <div>
        Du har valt: <strong>{selectedProgram || 'Inget'}</strong>
      </div>
    </div>
  );
}