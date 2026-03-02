import { TbCreditCard, TbRotateClockwise2, TbShoppingCart, TbUsers } from 'react-icons/tb';
import { getColor } from '@/helpers/color';

export const statCards = [{
  id: 1,
  title: 'Total Sales',
  value: 124.7,
  suffix: 'K',
  prefix: '$',
  icon: TbCreditCard,
  iconBg: 'primary'
}, {
  id: 2,
  title: 'Orders Placed',
  value: 2358,
  icon: TbShoppingCart,
  iconBg: 'success'
}, {
  id: 3,
  title: 'Active Customers',
  value: 839,
  icon: TbUsers,
  iconBg: 'info'
}, {
  id: 4,
  title: 'Refund Requests',
  value: 41,
  icon: TbRotateClockwise2,
  iconBg: 'warning'
}];

export const totalSalesChart = () => ({
  type: 'doughnut',
  data: {
    labels: ['Online Store', 'Retail Stores', 'B2B Revenue', 'Marketplace Revenue'],
    datasets: [{
      label: '2024',
      data: [300, 150, 100, 80],
      backgroundColor: [getColor('chart-primary'), getColor('chart-secondary'), getColor('chart-dark'), getColor('chart-gray')],
      borderColor: 'transparent',
      borderWidth: 1,
      weight: 1,
      cutout: '30%',
      radius: '90%'
    }, {
      label: '2023',
      data: [270, 135, 90, 72],
      backgroundColor: [getColor('chart-primary-rgb', 0.3), getColor('chart-secondary-rgb', 0.3), getColor('chart-dark-rgb', 0.3), getColor('chart-gray-rgb', 0.3)],
      borderColor: 'transparent',
      borderWidth: 3,
      weight: 0.8,
      cutout: '30%',
      radius: '60%'
    }]
  },
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: getComputedStyle(document.body).fontFamily
          },
          color: getColor('secondary-color'),
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            return `${ctx.dataset.label} - ${ctx.label}: ${ctx.parsed}`;
          }
        }
      }
    },
    maintainAspectRatio: false
  }
});

export const salesAnalyticsChart = () => ({
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue',
      type: 'bar',
      data: [65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56],
      backgroundColor: getColor('chart-primary'),
      borderColor: getColor('chart-primary'),
      borderWidth: 1
    }, {
      label: 'Profit',
      type: 'line',
      data: [28, 48, 40, 19, 86, 27, 90, 28, 48, 40, 19, 86],
      backgroundColor: 'transparent',
      borderColor: getColor('chart-success'),
      borderWidth: 2,
      pointBackgroundColor: getColor('chart-success'),
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: getColor('chart-success')
    }]
  },
  options: {
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: getComputedStyle(document.body).fontFamily
          },
          color: getColor('secondary-color'),
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 15
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: getColor('border-color')
        },
        ticks: {
          color: getColor('secondary-color')
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: getColor('secondary-color')
        }
      }
    },
    maintainAspectRatio: false
  }
});
