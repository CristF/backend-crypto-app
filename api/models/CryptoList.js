import mongoose from "mongoose";

const cryptoListSchema = new mongoose.Schema({
    // Define the schema for the CryptoList model
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    price: { type: Number, required: true },
    marketCap: { type: Number, required: true },
    volume24h: { type: Number, required: true },
    change24h: { type: Number, required: true },
    circulatingSupply: { type: Number, required: true },
    totalSupply: { type: Number, required: true },
    maxSupply: { type: Number, required: true },
}, {
    timestamps: true,
});

export default mongoose.model('CryptoList', cryptoListSchema);