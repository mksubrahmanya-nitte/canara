import fetch from "node-fetch";
import User from "../models/user.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  monthlyBudget: user.monthlyBudget,
  currency: user.currency,
});

export const convertCurrency = async (req, res) => {
    try {
        const { newCurrency } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const oldCurrency = user.currency;
        if (oldCurrency === newCurrency) {
            // If the currency is the same, no need to do anything.
            // Still, we can send back a success response.
            return res.status(200).json({ message: "Currency is already set to the desired one.", user: sanitizeUser(user) });
        }

        // Fetch exchange rate from Frankfurter API
        const response = await fetch(`https://api.frankfurter.app/latest?from=${oldCurrency}&to=${newCurrency}`);
        if (!response.ok) {
            // This can happen if the currency codes are not valid for the API
            return res.status(400).json({ message: "Failed to fetch exchange rate. The currency code may be invalid." });
        }
        const data = await response.json();
        const rate = data.rates[newCurrency];

        if (!rate) {
            return res.status(400).json({ message: `Invalid currency code: ${newCurrency}` });
        }

        // Convert monthly budget
        const newMonthlyBudget = user.monthlyBudget * rate;

        // Update user in the database
        user.currency = newCurrency;
        user.monthlyBudget = newMonthlyBudget;
        await user.save();
        
        res.status(200).json({ message: "Currency updated successfully. Your budget has been converted.", user: sanitizeUser(user) });

    } catch (error) {
        console.error("Currency conversion error:", error);
        res.status(500).json({ message: "An unexpected error occurred during currency conversion." });
    }
};
