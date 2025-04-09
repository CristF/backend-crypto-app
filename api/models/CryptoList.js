import mongoose from "mongoose";

const cryptoListSchema = new mongoose.Schema({
    // Define the schema for the CryptoList model
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    marketCap: { type: Number, required: true },
    current_price: { type: Number, required: true },
    ath: { type: Number, required: true },
    price_change_24h: { type: Number, required: true },
    high_24h: { type: Number, required: true },
    low_24h: { type: Number, required: true },
    total_volume: { type: Number, required: true },
    circulating_supply: { type: Number, required: true },
    total_supply: { type: Number, required: true },
    max_supply: { type: Number, required: true },
}, {
    timestamps: true,
});

export default mongoose.model('CryptoList', cryptoListSchema);