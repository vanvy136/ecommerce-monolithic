
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 1. Tạo vai trò
  const adminRole = await prisma.role.create({
    data: { rolename: "Admin" },
  });

  const customerRole = await prisma.role.create({
    data: { rolename: "Customer" },
  });

  // 2. Tạo hạng thành viên
  const membership = await prisma.memberShip.create({
    data: {
      mname: "Bronze",
      score: 0,
    },
  });

  // 3. Tạo sản phẩm
  await prisma.product.createMany({
    data: [
      { pname: "Laptop Dell", price: 15000000, quantity: 10 },
      { pname: "Chuot Logitech", price: 350000, quantity: 30 },
      { pname: "Ban phim co", price: 1200000, quantity: 20 },
    ],
  });

  // 4. Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 5. Tạo tài khoản mẫu
  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        fullname: "System Administrator",
        password: hashedPassword,
        roleid: adminRole.roleid,
        mid: membership.mid,
      },
      {
        username: "customer",
        fullname: "Test Customer",
        password: hashedPassword,
        roleid: customerRole.roleid,
        mid: membership.mid,
      },
    ],
  });

  console.log("Seed data completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
