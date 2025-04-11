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

// Update the fetchAllCryptos function
export const fetchAllCryptos = async () => {
    try {
        const response = await api.get('/crypto/saved-cryptos');
        return response.data;
    } catch (error) {
        console.error('Error fetching all cryptos:', error);
        throw error;
    }
};