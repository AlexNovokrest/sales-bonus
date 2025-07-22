/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
  const { discount, sale_price, quantity } = purchase;
  const discountDecimal = discount / 100;
  const totalPrice = sale_price * quantity;
  const revenue = totalPrice * (1 - discountDecimal);
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (total === 1) {
    // Если всего один продавец, бонус 15%
    return 0.15;
  }
  if (index === 0) {
    // Первый по прибыли продавец — 15%
    return 0.15;
  } else if (index === 1 || index === 2) {
    // Второй и третий — по 10%
    return 0.10;
  } else if (index === total - 1) {
    // Последний — 0%
    return 0;
  } else {
    // Все остальные — 5%
    return 0.05;
  }
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
      // Проверка входных данных
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректные данные: ожидается объект с данными продаж');
  }
  if (!options || typeof options !== 'object') {
    throw new Error('Опции должны быть объектом');
  }

  const { calculateRevenue, calculateBonus } = options;

  if (typeof calculateRevenue !== 'function') {
    throw new Error('Отсутствует функция для расчета выручки');
  }
  if (typeof calculateBonus !== 'function') {
    throw new Error('Отсутствует функция для расчета бонусов');
  }

  // Подготовка промежуточных данных
  const salesRecords = data.purchase_records || [];
  const productsMap = new Map();
  const sellersMap = new Map();

  // Индексация товаров
  (data.products || []).forEach(product => {
    productsMap.set(product.id, product);
  });

  // Обработка продаж
  salesRecords.forEach(purchase => {
    const product = productsMap.get(purchase.product_id);
    if (!product) return; // пропускаем, если товар не найден

    // Расчет выручки
    const revenue = calculateRevenue(purchase, product);

    // Расчет прибыли (пример, можно расширить)
    const profit = revenue - (product.cost_price * purchase.quantity);

    // Получение продавца
    const sellerId = purchase.seller_id;
    if (!sellersMap.has(sellerId)) {
      sellersMap.set(sellerId, {
        seller_id: sellerId,
        name: purchase.seller_name,
        totalRevenue: 0,
        totalProfit: 0,
        salesCount: 0,
        top_products: new Map(),
      });
    }
    const sellerData = sellersMap.get(sellerId);

    // Обновление данных продавца
    sellerData.totalRevenue += revenue;
    sellerData.totalProfit += profit;
    sellerData.salesCount += purchase.quantity;

    // Подсчет популярных товаров
    const productName = product.name;
    sellerData.top_products.set(
      productName,
      (sellerData.top_products.get(productName) || 0) + purchase.quantity
    );
  });

  // Формирование массива продавцов
  const sellersArray = Array.from(sellersMap.values());

  // Сортировка продавцов по прибыли
  sellersArray.sort((a, b) => b.totalProfit - a.totalProfit);

  // Назначение бонусов
  const totalSellers = sellersArray.length;
  sellersArray.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, totalSellers, seller);
  });

  // Формирование итогового отчета
  const result = sellersArray.map(seller => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: seller.totalRevenue,
    profit: seller.totalProfit,
    sales_count: seller.salesCount,
    top_products: Array.from(seller.top_products.entries()).sort((a, b) => b[1] - a[1]),
    bonus: seller.bonus,
  }));

  return result;
}