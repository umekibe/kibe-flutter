function payment_calculator(bal, type, value, id, total_ratio = 1) {
  let sent = 0;
  if (type == "FLAT") {
    sent = value;
    bal -= sent;
    return { balance: bal, sent, id };
  } else if (type == "PERCENTAGE") {
    sent = (value / 100) * bal;
    bal -= sent;
    return { balance: bal, sent, id };
  } else if (type == "RATIO") {
    sent = (value / total_ratio) * bal;
    bal -= sent;
    return { balance: bal, sent, id };
  }
}

module.exports = payment_calculator
