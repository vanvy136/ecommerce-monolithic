
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

// Middleware xác thực JWT
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

    // Lay Role Customer
    const role = await prisma.role.findFirst({
      where: {
        rolename: "Customer",
      },
    });

    // Lay MemberShip Bronze
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

    // Ma hoa mat khau
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tao tai khoan
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

    // Tim tai khoan
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

    // Kiem tra mat khau
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

    // Tao JWT Token
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
// START SERVER - LUON DAT CUOI FILE
// ========================================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
