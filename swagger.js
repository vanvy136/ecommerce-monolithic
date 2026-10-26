
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce Monolithic API",
      version: "1.0.0",
      description:
        "REST API quản lý sản phẩm, tài khoản, đơn hàng và vận chuyển.",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Health", description: "Kiểm tra hệ thống" },
      { name: "Products", description: "Quản lý sản phẩm" },
      { name: "Authentication", description: "Xác thực tài khoản" },
      { name: "Orders", description: "Quản lý đơn hàng" },
      { name: "Shipments", description: "Quản lý vận chuyển" },
    ],
  },
  apis: ["./server.js"],
};

module.exports = swaggerJsdoc(options);
