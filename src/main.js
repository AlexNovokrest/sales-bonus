function calculateSimpleRevenue(purchase, product) {
    const item = purchase.items.find(i => i.sku === product.sku);
    if (!item) return 0;
    const salePrice = item.sale_price || 0;
    const discount = item.discount || 0;
    const purchasePrice = product.purchase_price || 0;
    const quantity = item.quantity || 0;
    const discountedPrice = salePrice * (1 - discount / 100);
    const profit = (discountedPrice - purchasePrice) * quantity;
    return parseFloat(profit.toFixed(2));
}

function calculateBonusByProfit(index, total, seller) {
    let bonusCoefficient = 0;
    if (index === 0) bonusCoefficient = 0.15;
    else if (index < 3) bonusCoefficient = 0.1;
    else if (index < 10) bonusCoefficient = 0.05;
    else bonusCoefficient = 0.02;

    if (seller.position && seller.position.includes("Senior")) {
        bonusCoefficient += 0.03;
    }

    const baseBonus = 1000;
    const bonus = baseBonus * (1 + bonusCoefficient) * (1 - index / total);
    return Math.round(bonus);
}

function analyzeSalesData(data, options = {}) {
    if (!data || !data.purchase_records || !data.sellers || !data.products) {
        throw new Error("Invalid input data");
    }

    const sellersMap = {};
    const productsMap = {};

    data.sellers.forEach(seller => {
        sellersMap[seller.id] = seller;
    });

    data.products.forEach(product => {
        productsMap[product.sku] = product;
    });

    const sellersStats = {};

    data.purchase_records.forEach(purchase => {
        const sellerId = purchase.seller_id;

        if (!sellersStats[sellerId]) {
            sellersStats[sellerId] = {
                seller_id: sellerId,
                revenue: 0,
                profit: 0,
                sales_count: 0,
                products: {}
            };
        }

        const sellerStat = sellersStats[sellerId];
        sellerStat.sales_count += 1;

        purchase.items.forEach(item => {
            const product = productsMap[item.sku];
            if (!product) return;

            const salePrice = item.sale_price || 0;
            const discount = item.discount || 0;
            const quantity = item.quantity || 0;

            const itemRevenue = salePrice * (1 - discount / 100) * quantity;
            sellerStat.revenue += itemRevenue;

            const itemProfit = calculateSimpleRevenue(purchase, product);
            sellerStat.profit += itemProfit;

            if (!sellerStat.products[item.sku]) {
                sellerStat.products[item.sku] = {
                    sku: item.sku,
                    quantity: 0
                };
            }
            sellerStat.products[item.sku].quantity += quantity;
        });
    });

    const sellersArray = Object.values(sellersStats);
    sellersArray.sort((a, b) => b.profit - a.profit);
    const totalSellers = sellersArray.length;

    sellersArray.forEach((sellerStat, index) => {
        const seller = sellersMap[sellerStat.seller_id];
        sellerStat.bonus = calculateBonusByProfit(index, totalSellers, seller);
        sellerStat.name = `${seller.first_name} ${seller.last_name}`;

        const products = Object.values(sellerStat.products);
        products.sort((a, b) => b.quantity - a.quantity);
        sellerStat.top_products = products.slice(0, 10);

        sellerStat.revenue = Math.round(sellerStat.revenue);
        sellerStat.profit = Math.round(sellerStat.profit);
    });

    return sellersArray;
}