import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';

const RecentOrders = () => {
  return (
    <Card>
      <CardHeader className="justify-content-between align-items-center border-dashed">
        <CardTitle as="h4" className="mb-0">
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-muted">Recent orders table will be implemented here.</p>
      </CardBody>
    </Card>
  );
};

export default RecentOrders;
