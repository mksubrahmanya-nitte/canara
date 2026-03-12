import Loan from "../models/loan.model.js";

export const createLoan = async (req, res) => {
  try {
    const { personName, amount, type, note, dueDate } = req.body;

    if (!personName?.trim()) {
      return res.status(400).json({ message: "Person name is required" });
    }
    if (!["lent", "borrowed"].includes(type)) {
      return res.status(400).json({ message: "Type must be lent or borrowed" });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    const loan = await Loan.create({
      userId: req.user.id,
      personName: personName.trim(),
      amount: parsedAmount,
      type,
      note: String(note || "").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json(loan);
  } catch {
    res.status(500).json({ message: "Failed to create loan" });
  }
};

export const getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(loans);
  } catch {
    res.status(500).json({ message: "Failed to fetch loans" });
  }
};

export const getLoanSummary = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id, status: "pending" });
    const totalLent = loans.filter((l) => l.type === "lent").reduce((s, l) => s + l.amount, 0);
    const totalBorrowed = loans.filter((l) => l.type === "borrowed").reduce((s, l) => s + l.amount, 0);

    res.status(200).json({
      totalLent: Number(totalLent.toFixed(2)),
      totalBorrowed: Number(totalBorrowed.toFixed(2)),
      netBalance: Number((totalLent - totalBorrowed).toFixed(2)),
    });
  } catch {
    res.status(500).json({ message: "Failed to get loan summary" });
  }
};

export const markLoanAsPaid = async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "paid" },
      { new: true },
    );
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(loan);
  } catch {
    res.status(500).json({ message: "Failed to mark loan as paid" });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const deleted = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json({ message: "Loan deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete loan" });
  }
};
