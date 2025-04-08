import express from 'express';
import User from '../models/User.js';
import CryptoList from '../models/CryptoList.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const cmcApi = axios.create({
    baseURL: 'https://pro-api.coinmarketcap.com/v1/',
    headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3/',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

//search for a cryptocurrency by name, returns relevant data
router.get('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }
        const response = await coingeckoApi.get('/search?query=' + query + '&x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                query: query
            }
        }); 
        
        const coins = response.data.coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.thumb,
            large: coin.large
        }));
        res.json(coins);
        
    }
    catch (error) {
        console.error('Error searching cryptocurrencies:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch cryptocurrency data' });
    }
});

//simply get the top 100 cryptocurrencies, up to the user defined limit
router.get('/top', async (req, res) => {
    try {
        const {number} = req.body;
        const limit = number || 100; // Default to 100 if no number is provided
        // limit to 100
        if (limit > 100) {
            return res.status(400).json({ message: 'Limit cannot exceed 100' });
        }
        const response = await cmcApi.get('/cryptocurrency/listings/latest', {
            params: {
                limit: limit,
                convert: 'USD'
            }
        });

        res.json(response.data.data);
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch cryptocurrency data' });
    }
});

//the user specified which of the top 100 cryptocurrencies to add to the database
router.get('/add', async (req, res) => {
    try {
        const {number} = req.body;
        const limit = number || 100; // Default to 100 if no number is provided
        // limit to 100
        if (limit > 100) {
            return res.status(400).json({ message: 'Limit cannot exceed 100' });
        }
        const response = await cmcApi.get('/cryptocurrency/listings/latest', {
            params: {
                limit: limit,
                convert: 'USD'
            }
        });

        const parsedCryptos = response.data.data.map (crypto => ({ 
            name: crypto.name,
            symbol: crypto.symbol,
            price: crypto.quote.USD.price,
            marketCap: crypto.quote.USD.market_cap,
            volume24h: crypto.quote.USD.volume_24h,
            change24h: crypto.quote.USD.percent_change_24h,
            circulatingSupply: crypto.circulating_supply,
            totalSupply: crypto.total_supply,
            maxSupply: crypto.max_supply || 0
        }));

        const savePromises = parsedCryptos.map(async crypto => {
            return await CryptoList.findOneAndUpdate(
                { symbol: crypto.symbol },
                crypto,
                { upsert: true, new: true }
            );
        });

        await Promise.all(savePromises);

        res.json(parsedCryptos);

        //res.json(response.data.data);
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch cryptocurrency data' });
    }
});

// Get a specific cryptocurrency by ID


router.get('/historical', async (req, res) => {
    try {
        const timeStart = req.query.time_start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days ago
        const timeEnd = req.query.time_end || new Date().toISOString(); // Default to now

        const response = await cmcApi.get('https://pro-api.coinmarketcap.com/v3/index/cmc100-historical', {
            params: {
                time_start: timeStart,
                time_end: timeEnd,
            }
        });
        res.json(response.data.data);
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch cryptocurrency data' });
    }
});

export default router;