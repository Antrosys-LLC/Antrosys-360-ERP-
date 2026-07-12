import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInventoryData() {
  console.log('📦 Seeding inventory data...');

  const existingCategories = await prisma.inventoryCategory.count();
  if (existingCategories > 0) {
    console.log('  ⏭️ Inventory data already exists, skipping');
    return;
  }

  const categories = await Promise.all([
    prisma.inventoryCategory.create({ data: { name: 'IT hardware' } }),
    prisma.inventoryCategory.create({ data: { name: 'Office equipment' } }),
    prisma.inventoryCategory.create({ data: { name: 'Furniture' } }),
    prisma.inventoryCategory.create({ data: { name: 'Consumables' } }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    categoryMap[cat.name] = cat.id;
  }

  const items = [
    {
      name: 'MacBook Pro 14"',
      sku: 'IT-MBP-14',
      category: 'IT hardware',
      location: 'HQ - Floor 3',
      qty: 4,
      minStockLevel: 10,
      maxStockLevel: 30,
      supplier: 'TechStore Pk',
      unitCost: 550000,
      leadTime: '14 days',
    },
    {
      name: 'Logitech MX Master 3S',
      sku: 'IT-PER-MX3',
      category: 'IT hardware',
      location: 'Branch A',
      qty: 0,
      minStockLevel: 10,
      maxStockLevel: 50,
      supplier: 'LogiDist PK',
      unitCost: 25000,
      leadTime: '7 days',
    },
    {
      name: 'Ergo Office Chair V2',
      sku: 'FN-CHR-E2',
      category: 'Furniture',
      location: 'HQ - Storage',
      qty: 45,
      minStockLevel: 5,
      maxStockLevel: 60,
      supplier: 'Furnishings Co.',
      unitCost: 35000,
      leadTime: '21 days',
    },
    {
      name: 'A4 Notebooks (Ruled)',
      sku: 'CS-NB-A4',
      category: 'Consumables',
      location: 'Branch B',
      qty: 340,
      minStockLevel: 50,
      maxStockLevel: 500,
      supplier: 'Stationery Hub',
      unitCost: 850,
      leadTime: '3 days',
    },
    {
      name: 'HP LaserJet Toner Black',
      sku: 'CS-TN-HPB',
      category: 'Consumables',
      location: 'HQ - Storage',
      qty: 18,
      minStockLevel: 10,
      maxStockLevel: 50,
      supplier: 'TechStore Pk',
      unitCost: 14500,
      leadTime: '5 days',
    },
    {
      name: 'Dell U2720Q Monitor',
      sku: 'IT-MON-D27',
      category: 'IT hardware',
      location: 'HQ - Floor 2',
      qty: 2,
      minStockLevel: 5,
      maxStockLevel: 20,
      supplier: 'TechStore Pk',
      unitCost: 85000,
      leadTime: '10 days',
    },
    {
      name: 'Standing Desk Pro',
      sku: 'FN-DSK-SD1',
      category: 'Furniture',
      location: 'HQ - Floor 1',
      qty: 12,
      minStockLevel: 3,
      maxStockLevel: 25,
      supplier: 'Furnishings Co.',
      unitCost: 75000,
      leadTime: '14 days',
    },
    {
      name: 'Stapler Heavy Duty',
      sku: 'CS-STP-HD',
      category: 'Consumables',
      location: 'Branch B',
      qty: 85,
      minStockLevel: 20,
      maxStockLevel: 200,
      supplier: 'Stationery Hub',
      unitCost: 1200,
      leadTime: '2 days',
    },
    {
      name: 'Dell Latitude 5540',
      sku: 'IT-DLL-5540',
      category: 'IT hardware',
      location: 'HQ - Floor 2',
      qty: 12,
      minStockLevel: 8,
      maxStockLevel: 30,
      supplier: 'TechStore Pk',
      unitCost: 320000,
      leadTime: '10 days',
    },
    {
      name: 'Conference Speaker System',
      sku: 'OF-SPK-BT',
      category: 'Office equipment',
      location: 'HQ - Conference Room',
      qty: 3,
      minStockLevel: 2,
      maxStockLevel: 10,
      supplier: 'OfficeMart',
      unitCost: 45000,
      leadTime: '7 days',
    },
  ];

  for (const item of items) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) {
      console.warn(`  ⚠️ Category "${item.category}" not found, skipping item "${item.name}"`);
      continue;
    }

    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {
        qty: item.qty,
        location: item.location,
        supplier: item.supplier,
        unitCost: item.unitCost,
        leadTime: item.leadTime,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
      },
      create: {
        name: item.name,
        sku: item.sku,
        categoryId: categoryMap[item.category],
        location: item.location,
        qty: item.qty,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        supplier: item.supplier,
        unitCost: item.unitCost,
        leadTime: item.leadTime,
      },
    });
  }

  console.log('✅ Inventory seed data created');
}