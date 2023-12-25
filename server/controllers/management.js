import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "affiliatestats",
          localField: "_id",
          foreignField: "userId",
          as: "affiliateStats",
        },
      },
      { $unwind: "$affiliateStats" },
    ]);

    const saleTransactions = await Promise.all(
      userWithStats[0].affiliateStats.affiliateSales.map((id) => {
        return Transaction.findById(id);
      })
    );

    const filteredSalesTransactions = saleTransactions.filter(
      (Transaction) => Transaction !== null
    );

    const checkTransactions = async (affiliateSales) => {
      for (let id of affiliateSales) {
        const transaction = await Transaction.findById(id);
        if (transaction) {
          console.log(`Transaction bulundu: ${id}`);
        } else {
          console.log(`Transaction bulunamadı: ${id}`);
        }
      }
    };

    checkTransactions(userWithStats[0].affiliateStats.affiliateSales);

    res
      .status(200)
      .json({ user: userWithStats[0], sales: filteredSalesTransactions });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
