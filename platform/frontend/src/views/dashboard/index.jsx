import { Col, Container, Row } from 'react-bootstrap';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import ProfileDebug from '@/components/ProfileDebug';
import { statCards } from '@/views/dashboard/data';
import SalesCharts from '@/views/dashboard/components/SalesCharts';
import ProductInventory from '@/views/dashboard/components/ProductInventory';
import RecentOrders from '@/views/dashboard/components/RecentOrders';
import StatCard from "@/views/dashboard/components/StatCard";

const Dashboard = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title={'Dashboard'} />
      
      {/* Profile Debug Component - Remove this in production */}
      <Row>
        <Col xs={12}>
          <ProfileDebug />
        </Col>
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {statCards.map((item, idx) => (
          <Col key={idx}>
            <StatCard item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12}>
          <SalesCharts />
        </Col>
      </Row>

      <Row>
        <Col xxl={6}>
          <ProductInventory />
        </Col>

        <Col xxl={6}>
          <RecentOrders />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
