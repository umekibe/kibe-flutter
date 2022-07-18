const express = require("express");
const bodyparser = require("body-parser");

const app = express();

require("dotenv").config();
const payment_calculator = require("./calc")
const port = process.env.PORT || 4000;

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.get("/", (req, res, next) => {
  res.send("let's go");
});

app.post("/", (req, res, next) => {
  try {
    let content = req.body;
    let req_obj = content;
    let response_obj = {
      ID: req_obj.ID,
      SplitBreakdown: [],
    };
    let ratio_sum = 0,
      total_sum = 0;
    if (
      req_obj.SplitInfo.length > 20 ||
      req_obj.SplitInfo.length == 0
    ) {
      throw new Error("unable to process split entities");
    }

    let total_ratio = 0;
    let ratio_count = 0;
    req_obj.SplitInfo.forEach((item) => {
      if (item.SplitType == "RATIO") {
        total_ratio += item.SplitValue;
        ratio_count++;
      }
    });

    req_obj.SplitInfo.sort((a, b) => {
      if (a.SplitType == "FLAT") {
        return -3;
      }
      if (a.SplitType == "PERCENTAGE" && b.SplitType != "FLAT") {
        return -1;
      }
    });

    let initial_amount = req_obj.Amount;
    let c_balance = req_obj.Amount;

    for (let i = 0; i < req_obj.SplitInfo.length; i++) {
      let item = req_obj.SplitInfo[i];
      let return_obj;
      if (item.SplitType != "RATIO") {
        return_obj = payment_calculator(
          c_balance,
          item.SplitType,
          item.SplitValue,
          item.SplitEntityId
        );

        if (return_obj.sent > initial_amount) {
          throw new Error(
            " Insufficient Balance"
          );
        }
        if (return_obj.sent < 0) {
          throw new Error(
            "Invalid split values"
          );
        }

        c_balance = return_obj.balance;
        total_sum += return_obj.sent;
        response_obj.SplitBreakdown.push({
          SplitEntityId: return_obj.id,
          Amount: return_obj.sent,
        });
      } else {
        let val = ratio_count < 2 ? 1 : item.SplitValue;
        total_ratio = ratio_count < 2 ? item.SplitValue : total_ratio;
        return_obj = payment_calculator(
          c_balance,
          item.SplitType,
          val,
          item.SplitEntityId,
          total_ratio
        );

        if (return_obj.sent > initial_amount) {
          throw new Error(
            "Insufficient Balance"
          );
        }
        if (return_obj.sent < 0) {
          throw new Error(
            "Invalid split values"
          );
        }

        total_sum += return_obj.sent;
        ratio_sum += return_obj.sent;
        response_obj.SplitBreakdown.push({
          SplitEntityId: return_obj.id,
          Amount: return_obj.sent,
        });
      }
    }
    if (total_sum > initial_amount) {
      throw new Error(
        "Insufficient Balance"
      );
    }
    if (c_balance < 0) {
      throw new Error(
        "Insufficient Balance"
      );
    }
    response_obj.Balance = ratio_sum > 0 ? c_balance - ratio_sum : c_balance;
    console.log(response_obj);
    res.status(200).send(response_obj);

  } catch (e) {
    next(e.message, "Problem");
    e.type = "redirect"; // adding custom property to specify handling behaviour
    next(e);
  }
});

app.use((error, req, res, next) => {

  res.status(401).send(error);
});

app.listen(port, (req, res) => {
  console.log("listening");
});
