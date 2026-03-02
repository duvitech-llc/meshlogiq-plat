import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';

const ProductInventory = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle as="h4" className="mb-0">
          Product Inventory
        </CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Product inventory table will be implemented here.</p>
      </CardBody>
    </Card>
  );
};

export default ProductInventory;
