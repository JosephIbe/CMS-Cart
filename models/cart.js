module.exports = function Cart(oldCartItems) {
  this.items = oldCartItems.items || 0;
  this.totalQty = oldCartItems.totalQty || 0;
  this.totalPrice = oldCartItems.totalPrice || 0;

  this.add = function (item, prodId) {
    let storedItem = this.items[prodId];

    if (!storedItem){
        storedItem = this.items[prodId] = {
            qty: 0,
            price: 0,
            item: item
        };

        storedItem.qty++;
        storedItem.price = storedItem.item.price * storedItem.qty;

        this.totalQty++;
        this.totalPrice += storedItem.item.price;

    }

  };

  this.generateCartArray = function () {
      let arr = [];

      for (let prodId in this.items){
          arr.push(this.items[prodId]);
      }
      return arr;
  };


};