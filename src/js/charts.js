// Charts Module - Gráficos y visualización de datos
const Charts = {
  charts: {},

  createChart(ctxId, type, data, options) {
    try {
      if (this.charts[ctxId]) {
        this.charts[ctxId].destroy();
      }
      const ctx = document.getElementById(ctxId);
      if (!ctx) {
        console.warn(`Canvas element with id ${ctxId} not found`);
        return;
      }
      const canvasContext = ctx.getContext("2d");
      this.charts[ctxId] = new Chart(canvasContext, { type, data, options });
    } catch (error) {
      console.error(`Error creating chart ${ctxId}:`, error);
    }
  },

  initInventoryCharts() {
    try {
      if (!Auth.isAdmin()) return;

      const inventory = Storage.getInventory();
      let agotados = 0;
      let bajo = 0;
      let ok = 0;

      inventory.forEach((p) => {
        if (p.cantidad === 0) agotados++;
        else if (p.cantidad <= 5) bajo++;
        else ok++;
      });

      const pieData = {
        labels: ["Stock OK", "Stock Bajo (≤ 5)", "Agotados"],
        datasets: [
          {
            data: [ok, bajo, agotados],
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            hoverOffset: 4,
          },
        ],
      };

      const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
          title: { display: false },
        },
      };

      this.createChart("chart-stock-pie", "doughnut", pieData, pieOptions);

      const topSelling = Storage.getInventory()
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      const barData = {
        labels: topSelling.map((p) => p.nombre),
        datasets: [
          {
            label: "Stock Actual",
            data: topSelling.map((p) => p.cantidad),
            backgroundColor: "#3b82f6",
          },
        ],
      };

      const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
          x: {
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
        },
      };

      this.createChart("chart-top-bar", "bar", barData, barOptions);
    } catch (error) {
      console.error("Error initializing inventory charts:", error);
    }
  },

  initSalesCharts() {
    try {
      if (!Auth.isAdmin()) return;
      const sales = Storage.getSales();

      const salesByProduct = sales.reduce((acc, sale) => {
        const key = `${sale.codigoProducto} - ${sale.nombreProducto}`;
        acc[key] = (acc[key] || 0) + sale.cantidad;
        return acc;
      }, {});

      const sortedSales = Object.entries(salesByProduct)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const topProductsData = {
        labels: sortedSales.map(([name]) => name),
        datasets: [
          {
            label: "Unidades Vendidas",
            data: sortedSales.map(([, count]) => count),
            backgroundColor: "#10b981",
          },
        ],
      };

      const topProductsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
          y: {
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
        },
      };

      this.createChart(
        "chart-sales-top-products",
        "bar",
        topProductsData,
        topProductsOptions
      );

      const monthlyRevenue = sales.reduce((acc, sale) => {
        const date = new Date(sale.fecha);
        const monthYear = date.toLocaleString("es-CO", {
          month: "short",
          year: "numeric",
        });
        acc[monthYear] = (acc[monthYear] || 0) + sale.totalVenta;
        return acc;
      }, {});

      const monthlyRevenueData = {
        labels: Object.keys(monthlyRevenue),
        datasets: [
          {
            label: "Ingresos ($)",
            data: Object.values(monthlyRevenue),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            fill: true,
            tension: 0.1,
          },
        ],
      };

      const monthlyRevenueOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
          x: {
            ticks: {
              color: document.body.classList.contains("dark")
                ? "white"
                : "black",
            },
          },
        },
      };

      this.createChart(
        "chart-sales-monthly-revenue",
        "line",
        monthlyRevenueData,
        monthlyRevenueOptions
      );
    } catch (error) {
      console.error("Error initializing sales charts:", error);
    }
  },
};
