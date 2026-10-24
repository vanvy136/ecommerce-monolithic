
require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Chua cung cap JWT Token",
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "JWT Token khong hop le",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "JWT_SECRET chua duoc cau hinh",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "JWT Token khong hop le hoac da het han",
    });
  }
};



const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { uid: req.user.uid },
      include: { role: true },
    });

    if (!user || user.role.rolename.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Ban khong co quyen thuc hien chuc nang nay",
      });
    }

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Loi kiem tra quyen truy cap",
    });
  }
};

// ========================================
// 1. HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});

// ========================================
// 2. GET ALL PRODUCTS
// ========================================

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        pid: "asc",
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi lay danh sach san pham",
    });
  }
});

// ========================================
// 3. GET PRODUCT BY ID
// ========================================

app.get("/products/:id", async (req, res) => {
  try {
    const pid = Number(req.params.id);

    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({
        message: "ID san pham khong hop le",
      });
    }

    const product = await prisma.product.findUnique({
      where: { pid },
    });

    if (!product) {
      return res.status(404).json({
        message: "Khong tim thay san pham",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi lay thong tin san pham",
    });
  }
});

// ========================================
// 4. CREATE PRODUCT
// ========================================

app.post("/products", async (req, res) => {
  try {
    const { pname, price, quantity } = req.body || {};

    if (
      typeof pname !== "string" ||
      !pname.trim() ||
      pname.trim().length > 100 ||
      price === null ||
      price === undefined ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message: "Du lieu san pham khong hop le",
      });
    }

    const product = await prisma.product.create({
      data: {
        pname: pname.trim(),
        price: Number(price),
        quantity,
      },
    });

    res.status(201).json({
      message: "Them san pham thanh cong",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi them san pham",
    });
  }
});

// ========================================
// 5. UPDATE PRODUCT
// ========================================

app.put("/products/:id", async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const { pname, price, quantity } = req.body || {};

    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({
        message: "ID san pham khong hop le",
      });
    }

    if (
      typeof pname !== "string" ||
      !pname.trim() ||
      pname.trim().length > 100 ||
      price === null ||
      price === undefined ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message: "Du lieu san pham khong hop le",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { pid },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Khong tim thay san pham",
      });
    }

    const product = await prisma.product.update({
      where: { pid },
      data: {
        pname: pname.trim(),
        price: Number(price),
        quantity,
      },
    });

    res.status(200).json({
      message: "Cap nhat san pham thanh cong",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi cap nhat san pham",
    });
  }
});

// ========================================
// 6. DELETE PRODUCT
// ========================================

app.delete("/products/:id", async (req, res) => {
  try {
    const pid = Number(req.params.id);

    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({
        message: "ID san pham khong hop le",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { pid },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Khong tim thay san pham",
      });
    }

    await prisma.product.delete({
      where: { pid },
    });

    res.status(200).json({
      message: "Xoa san pham thanh cong",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi xoa san pham",
    });
  }
});

// ========================================
// 7. REGISTER
// ========================================

app.post("/auth/register", async (req, res) => {
  try {
    const { username, fullname, password } = req.body || {};

    if (
      typeof username !== "string" ||
      !username.trim() ||
      username.trim().length > 50 ||
      typeof fullname !== "string" ||
      !fullname.trim() ||
      fullname.trim().length > 100 ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Thong tin dang ky khong hop le",
      });
    }

    const normalizedUsername = username.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Ten dang nhap da ton tai",
      });
    }

    const role = await prisma.role.findFirst({
      where: {
        rolename: "Customer",
      },
    });

    const membership = await prisma.memberShip.findFirst({
      where: {
        mname: "Bronze",
      },
    });

    if (!role || !membership) {
      return res.status(500).json({
        message: "Chua co du lieu Role hoac MemberShip",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        fullname: fullname.trim(),
        password: hashedPassword,
        roleid: role.roleid,
        mid: membership.mid,
      },
      select: {
        uid: true,
        username: true,
        fullname: true,
        roleid: true,
        mid: true,
      },
    });

    res.status(201).json({
      message: "Dang ky tai khoan thanh cong",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi dang ky tai khoan",
    });
  }
});

// ========================================
// 8. LOGIN
// ========================================

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Vui long nhap username va password",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username.trim(),
      },
      include: {
        role: true,
        membership: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Sai ten dang nhap hoac mat khau",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Sai ten dang nhap hoac mat khau",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET chua duoc cau hinh",
      });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        roleid: user.roleid,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      }
    );

    res.status(200).json({
      message: "Dang nhap thanh cong",
      token,
      user: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        membership: user.membership.mname,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi dang nhap",
    });
  }
});

// ========================================
// 9. GET CURRENT USER
// ========================================

app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.user.uid,
      },
      select: {
        uid: true,
        username: true,
        fullname: true,
        roleid: true,
        mid: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Khong tim thay tai khoan",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi lay thong tin tai khoan",
    });
  }
});

// ========================================
// 10. CREATE ORDER
// ========================================

app.post("/orders", authenticateToken, async (req, res) => {
  try {
    const { items } = req.body || {};

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.some(
        (item) =>
          !item ||
          !Number.isInteger(item.pid) ||
          item.pid <= 0 ||
          !Number.isInteger(item.qty) ||
          item.qty <= 0
      )
    ) {
      return res.status(400).json({
        message: "Danh sach san pham khong hop le",
      });
    }

    const productIds = items.map((item) => item.pid);

    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        message: "San pham bi trung trong don hang",
      });
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const orderItems = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: {
              pid: item.pid,
            },
          });

          if (!product) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.pid}`);
          }

          const updated = await tx.product.updateMany({
            where: {
              pid: item.pid,
              quantity: {
                gte: item.qty,
              },
            },
            data: {
              quantity: {
                decrement: item.qty,
              },
            },
          });

          if (updated.count !== 1) {
            throw new Error(`OUT_OF_STOCK:${item.pid}`);
          }

          orderItems.push({
            pid: item.pid,
            qty: item.qty,
            unit_price: product.price,
          });
        }

        return tx.order.create({
          data: {
            uid: req.user.uid,
            createat: new Date(),
            orderDetails: {
              create: orderItems,
            },
          },
          include: {
            orderDetails: {
              include: {
                product: {
                  select: {
                    pid: true,
                    pname: true,
                  },
                },
              },
            },
          },
        });
      },
      {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 10000,
      }
    );

    const total = order.orderDetails.reduce(
      (sum, item) =>
        sum + Number(item.unit_price) * item.qty,
      0
    );

    return res.status(201).json({
      message: "Tao don hang thanh cong",
      order,
      total: total.toFixed(2),
    });
  } catch (error) {
    console.error(error);

    if (error.message?.startsWith("PRODUCT_NOT_FOUND:")) {
      return res.status(404).json({
        message: "Khong tim thay san pham",
      });
    }

    if (error.message?.startsWith("OUT_OF_STOCK:")) {
      return res.status(400).json({
        message: "San pham khong du so luong ton kho",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message: "Xung dot giao dich, vui long thu lai",
      });
    }

    return res.status(500).json({
      message: "Loi tao don hang",
    });
  }
});

// ========================================
// 11. GET MY ORDERS
// ========================================

app.get("/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        uid: req.user.uid,
      },
      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                pid: true,
                pname: true,
              },
            },
          },
        },
      },
      orderBy: {
        oid: "desc",
      },
    });

    const result = orders.map((order) => {
      const total = order.orderDetails.reduce(
        (sum, item) =>
          sum + Number(item.unit_price) * item.qty,
        0
      );

      return {
        ...order,
        total: total.toFixed(2),
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Loi lay danh sach don hang",
    });
  }
});



 // ========================================
 // 12. GET ORDER BY ID
 // ========================================

app.get("/orders/:id", authenticateToken, async (req, res) => {
  try {
    const oid = Number(req.params.id);

    if (!Number.isInteger(oid) || oid <= 0) {
      return res.status(400).json({
        message: "ID don hang khong hop le",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        oid,
        uid: req.user.uid,
      },
      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                pid: true,
                pname: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Khong tim thay don hang",
      });
    }

    const total = order.orderDetails.reduce(
      (sum, item) =>
        sum + Number(item.unit_price) * item.qty,
      0
    );

    return res.status(200).json({
      ...order,
      total: total.toFixed(2),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Loi lay chi tiet don hang",
    });
  }
});



 // ========================================
 // 13. CREATE SHIPMENT - ADMIN ONLY
 // ========================================

app.post(
  "/shipments",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { oid } = req.body || {};

      if (!Number.isInteger(oid) || oid <= 0) {
        return res.status(400).json({
          message: "ID don hang khong hop le",
        });
      }

      const order = await prisma.order.findUnique({
        where: { oid },
      });

      if (!order) {
        return res.status(404).json({
          message: "Khong tim thay don hang",
        });
      }

      const existingShipment = await prisma.shipment.findFirst({
        where: { oid },
      });

      if (existingShipment) {
        return res.status(409).json({
          message: "Don hang da co thong tin van chuyen",
        });
      }

      const shipment = await prisma.shipment.create({
        data: {
          oid,
          status: "Pending",
        },
      });

      return res.status(201).json({
        message: "Tao thong tin van chuyen thanh cong",
        shipment,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Loi tao thong tin van chuyen",
      });
    }
  }
);

 // ========================================
 // 14. GET SHIPMENT BY ORDER ID
 // ========================================

app.get("/shipments/:orderId", authenticateToken, async (req, res) => {
  try {
    const oid = Number(req.params.orderId);

    if (!Number.isInteger(oid) || oid <= 0) {
      return res.status(400).json({
        message: "ID don hang khong hop le",
      });
    }

    const user = await prisma.user.findUnique({
      where: { uid: req.user.uid },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        message: "Tai khoan khong hop le",
      });
    }

    const isAdmin =
      user.role.rolename.toLowerCase() === "admin";

    const order = await prisma.order.findFirst({
      where: {
        oid,
        ...(isAdmin ? {} : { uid: user.uid }),
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Khong tim thay don hang",
      });
    }

    const shipments = await prisma.shipment.findMany({
      where: { oid },
      orderBy: { shipid: "desc" },
    });

    return res.status(200).json({
      oid,
      shipments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Loi lay thong tin van chuyen",
    });
  }
});


 // ========================================
 // 15. UPDATE SHIPMENT STATUS - ADMIN ONLY
 // ========================================

app.put(
  "/shipments/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const shipid = Number(req.params.id);
      const { status } = req.body || {};

      if (!Number.isInteger(shipid) || shipid <= 0) {
        return res.status(400).json({
          message: "ID van chuyen khong hop le",
        });
      }

      const validStatuses = [
        "Pending",
        "Shipping",
        "Delivered",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Trang thai van chuyen khong hop le",
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { shipid },
      });

      if (!shipment) {
        return res.status(404).json({
          message: "Khong tim thay thong tin van chuyen",
        });
      }

      const allowedTransitions = {
        Pending: ["Shipping"],
        Shipping: ["Delivered"],
        Delivered: [],
      };

      if (!allowedTransitions[shipment.status]?.includes(status)) {
        return res.status(409).json({
          message: "Khong the chuyen sang trang thai nay",
        });
      }

      const updated = await prisma.shipment.updateMany({
        where: {
          shipid,
          status: shipment.status,
        },
        data: { status },
      });

      if (updated.count !== 1) {
        return res.status(409).json({
          message: "Trang thai da thay doi, vui long thu lai",
        });
      }

      const updatedShipment = await prisma.shipment.findUnique({
        where: { shipid },
      });

      return res.status(200).json({
        message: "Cap nhat trang thai van chuyen thanh cong",
        shipment: updatedShipment,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Loi cap nhat trang thai van chuyen",
      });
    }
  }
);

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
