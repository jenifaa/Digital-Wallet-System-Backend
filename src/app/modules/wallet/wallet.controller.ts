/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { walletService } from "./wallet.service";

 const addMoney = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { amount } = req.body;
    const wallet = await walletService.addMoney(userId as string, amount);
    res.status(200).json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    // const role = req.body.role;
    const wallet = await walletService.getWalletByUser(userId as string);
    res.status(200).json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//
// 💸 Withdraw Money
//
export const withdraw = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { amount } = req.body;
    const wallet = await walletService.withdraw(userId as string, amount);
    res.status(200).json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//
// 🔁 Send Money (User → User)
//
// export const sendMoney = async (req: Request, res: Response) => {
//   try {
//     const senderId = req.user._id;
//     const { receiverId, amount } = req.body;
//     const result = await walletService.sendMoney(senderId, receiverId, amount);
//     res.status(200).json({ success: true, data: result });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

//
// 🏦 Agent Cash-In
//
// export const cashIn = async (req: Request, res: Response) => {
//   try {
//     const agentId = req.user._id;
//     const { userId, amount } = req.body;
//     const wallet = await walletService.cashIn(agentId, userId, amount);
//     res.status(200).json({ success: true, data: wallet });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

//
// 🏧 Agent Cash-Out
//
// export const cashOut = async (req: Request, res: Response) => {
//   try {
//     const agentId = req.user._id;
//     const { userId, amount } = req.body;
//     const wallet = await walletService.cashOut(agentId, userId, amount);
//     res.status(200).json({ success: true, data: wallet });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

//
// 👑 Admin: Update Wallet Status
//
// export const updateWalletStatus = async (req: Request, res: Response) => {
//   try {
//     const { walletId } = req.params;
//     const { status } = req.body;

//     if (!Object.values(WalletStatus).includes(status)) {
//       throw new Error("Invalid wallet status");
//     }

//     const wallet = await walletService.updateWalletStatus(walletId, status);
//     res.status(200).json({ success: true, data: wallet });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

//
// 👑 Admin: Get All Wallets
//
// export const getAllWallets = async (req: Request, res: Response) => {
//   try {
//     const wallets = await walletService.getAllWallets();
//     res.status(200).json({ success: true, data: wallets });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

//
// 👑 Admin: Get Single Wallet
//
// export const getSingleWallet = async (req: Request, res: Response) => {
//   try {
//     const { walletId } = req.params;
//     const wallet = await walletService.getSingleWallet(walletId);
//     res.status(200).json({ success: true, data: wallet });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

export const WalletController = {
  addMoney,
  getMyWallet,
};
