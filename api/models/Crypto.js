import mongoose from "mongoose";

const cryptoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listName: {
        type: String,
        required: true
    },
    cryptos: [{
        cryptoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CryptoList',
            required: true
        },
        dateAdded: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        }
    }]
}, {
    timestamps: true
});

// Compound index to ensure unique list names per user
cryptoSchema.index({ userId: 1, listName: 1 }, { unique: true });

export default mongoose.model('Crypto', cryptoSchema);