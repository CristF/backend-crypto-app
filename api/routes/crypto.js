import express, { Router } from 'express';
import User from '../models/User.js';
import CryptoList from '../models/CryptoList.js';
import Crypto from '../models/Crypto.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/userMiddleware.js';

dotenv.config();

const router = express.Router();
/*
const cmcApi = axios.create({
    baseURL: 'https://pro-api.coinmarketcap.com/v1/',
    headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});
*/

const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3/',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Update the search endpoint
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }
        
        const response = await coingeckoApi.get('/search?query=' + query + '&x_cg_demo_api_key=' + process.env.CG_API_KEY);
        
        // Return more useful data for frontend
        const coins = response.data.coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            market_cap_rank: coin.market_cap_rank,
            thumb: coin.thumb
        }));
        
        res.json(coins);
    } catch (error) {
        console.error('Error searching cryptocurrencies:', error);
        res.status(500).json({ message: 'Failed to fetch cryptocurrency data' });
    }
});

// New endpoint to search and save in one step
router.post('/search-and-save', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        // First search for the coins
        const searchResponse = await coingeckoApi.get('/search?query=' + query + '&x_cg_demo_api_key=' + process.env.CG_API_KEY);
        const coinIds = searchResponse.data.coins.map(coin => coin.id);

        // Then get market data and save
        const marketResponse = await coingeckoApi.get('/coins/markets?' + 'x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                vs_currency: 'usd',
                ids: coinIds.join(','),
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false
            }
        });

        // Parse and save the data
        const cryptoData = marketResponse.data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            marketCap: coin.market_cap,
            current_price: coin.current_price,
            ath: coin.ath,
            price_change_24h: coin.price_change_24h,
            high_24h: coin.high_24h,
            low_24h: coin.low_24h,
            total_volume: coin.total_volume,
            circulating_supply: coin.circulating_supply,
            total_supply: coin.total_supply || 0,
            max_supply: coin.max_supply || 0,
        }));

        const savedCryptos = await Promise.all(
            cryptoData.map(async crypto => {
                return await CryptoList.findOneAndUpdate(
                    { symbol: crypto.symbol },
                    crypto,
                    { upsert: true, new: true }
                );
            })
        );

        // Return saved cryptos with their MongoDB IDs
        const savedRefs = savedCryptos.map(crypto => ({
            _id: crypto._id,
            name: crypto.name,
            symbol: crypto.symbol,
            current_price: crypto.current_price,
            price_change_24h: crypto.price_change_24h
        }));

        res.json(savedRefs);

    } catch (error) {
        console.error('Error in search and save:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to search and save cryptocurrency data' });
    }
});

// Update the market data endpoint
router.get('/search/market', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids) {
            return res.status(400).json({ message: 'Ids parameter is required' });
        }
        
        const response = await coingeckoApi.get('/coins/markets?' + 'x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                vs_currency: 'usd',
                ids: ids,
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ message: 'Failed to fetch market data' });
    }
});

// Update the market data endpoint to handle single ID
router.get('/search/market/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: 'Cryptocurrency ID is required' });
        }
        
        const response = await coingeckoApi.get('/coins/markets?' + 'x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                vs_currency: 'usd',
                ids: id,
                order: 'market_cap_desc',
                sparkline: false
            }
        });
        
        if (!response.data || response.data.length === 0) {
            return res.status(404).json({ message: 'Cryptocurrency not found' });
        }
        
        res.json(response.data[0]); // Return single crypto data
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ message: 'Failed to fetch market data' });
    }
});

router.post('/save-crypto', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids) {
            return res.status(400).json({ message: 'Ids parameter is required' });
        }

        //fetch market data from coingecko
        const response = await coingeckoApi.get('/coins/markets?' + 'x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                vs_currency: 'usd',
                ids: ids,
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false
            }
        });

        //parse the data to save in the database
        const cryptoData = response.data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            marketCap: coin.market_cap,
            current_price: coin.current_price,
            ath: coin.ath,
            price_change_24h: coin.price_change_24h,
            high_24h: coin.high_24h,
            low_24h: coin.low_24h,
            total_volume: coin.total_volume,
            circulating_supply: coin.circulating_supply,
            total_supply: coin.total_supply || 0,
            max_supply: coin.max_supply || 0,
        }));

        const savedCryptos = await Promise.all(
            cryptoData.map(async crypto => {
                return await CryptoList.findOneAndUpdate(
                    { symbol: crypto.symbol },
                    crypto,
                    { upsert: true, new: true }
                );
            })
        );

        // Return simplified response with just id, name, and symbol
        const cryptoRefs = savedCryptos.map(crypto => ({
            _id: crypto._id,
            name: crypto.name,
            symbol: crypto.symbol
        }));

        //res.json(savedCryptos); // original response with all data
        // Return only the relevant data to the client
        res.json(cryptoRefs);
    } catch (error) {
        console.error('Error saving cryptocurrency:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to save cryptocurrency data' });
        
    }
});

router.get('/saved-cryptos', async (req, res) => {
    try {
        // First get saved cryptos from database
        const cryptos = await CryptoList.find({}).select({
            _id: 1,
            name: 1,
            symbol: 1,
            marketCap: 1,
            current_price: 1,
            ath: 1,
            price_change_24h: 1,
            high_24h: 1,
            low_24h: 1,
            total_volume: 1,
            circulating_supply: 1,
            total_supply: 1,
            max_supply: 1
        });

        if (!cryptos || cryptos.length === 0) {
            return res.status(404).json({ message: 'No cryptocurrencies found' });
        }

        // Get IDs for CoinGecko API
        const coinIds = cryptos.map(crypto => 
            crypto.name.toLowerCase().replace(/\s+/g, '-')
        ).join(',');

        // Fetch images from CoinGecko
        const imageResponse = await coingeckoApi.get('/coins/markets?' + 'x_cg_demo_api_key=' + process.env.CG_API_KEY, {
            params: {
                vs_currency: 'usd',
                ids: coinIds,
                per_page: 250,
                sparkline: false
            }
        });

        // Create image lookup map
        const imageMap = imageResponse.data.reduce((acc, coin) => {
            acc[coin.name] = {
                image: coin.image,
                thumb: coin.image.replace('/large/', '/thumb/')
            };
            return acc;
        }, {});

        // Combine database data with images
        const cryptosWithImages = cryptos.map(crypto => ({
            ...crypto.toObject(),
            images: imageMap[crypto.name] || {
                image: null,
                thumb: null
            }
        }));

        res.json(cryptosWithImages);
    } catch (error) {
        console.error('Error fetching saved cryptos:', error);
        res.status(500).json({ message: 'Failed to fetch saved cryptos' });
    }
});


// creating a new list for a user

router.post('/create-list', verifyToken, async (req, res) => {
    try {
        const { listName, cryptoIds } = req.body;

        // Check if list name already exists for this user
        const existingList = await Crypto.findOne({
            userId: req.user,
            listName: listName
        });

        if (existingList) {
            return res.status(400).json({ 
                message: 'A list with this name already exists for this user' 
            });
        }

        // verify that cryptos exist in cryptoList
        const cryptos = await CryptoList.find({
            '_id': { $in: cryptoIds}
        });
        
        if (cryptos.length !== cryptoIds.length) {
            return res.status(400).json({ 
                message: 'Some cryptocurrencies not found in the database' 
            });
        }

        const cryptoList = new Crypto({
            userId: req.user,
            listName,
            cryptos: cryptoIds.map(id => ({ cryptoId: id }))
        });

        await cryptoList.save();

        const populatedList = await Crypto.findById(cryptoList._id)
            .populate('cryptos.cryptoId');

        res.status(201).json(populatedList);
    } catch (error) {
        console.error('Error creating list:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to create list' });
    }
})

// Get user's lists with crypto details
router.get('/get-list', verifyToken, async (req, res) => {
    try {
        const lists = await Crypto.find({ userId: req.user })
            .populate('cryptos.cryptoId');
        res.json(lists);
    } catch (error) {
        console.error('Error fetching crypto lists:', error);
        res.status(500).json({ message: 'Failed to fetch crypto lists' });
    }
});

router.delete('/remove-from-list/:listId/:cryptoId', verifyToken, async (req, res) => {
    try {
        const { listId, cryptoId } = req.params;

        // Find the list and verify it belongs to the user
        const list = await Crypto.findOne({
            _id: listId,
            userId: req.user
        });

        if (!list) {
            return res.status(404).json({ 
                message: 'List not found or unauthorized' 
            });
        }

        // Remove the crypto from the list's cryptos array
        list.cryptos = list.cryptos.filter(
            crypto => crypto.cryptoId.toString() !== cryptoId
        );

        await list.save();

        // Return the updated list with populated crypto details
        const updatedList = await Crypto.findById(listId)
            .populate('cryptos.cryptoId');

        res.json(updatedList);
    } catch (error) {
        console.error('Error removing crypto from list:', error);
        res.status(500).json({ 
            message: 'Failed to remove cryptocurrency from list' 
        });
    }
});

// Get specific list details by ID
router.get('/findListBy/:listId', verifyToken, async (req, res) => {
    try {
        const list = await Crypto.findOne({
            _id: req.params.listId,
            userId: req.user
        }).populate('cryptos.cryptoId');

        if (!list) {
            return res.status(404).json({
                message: 'List not found or unauthorized'
            });
        }

        // Return detailed list information including market cap and volume
        res.json({
            listId: list._id,
            listName: list.listName,
            cryptos: list.cryptos.map(crypto => ({
                cryptoId: crypto.cryptoId._id,
                name: crypto.cryptoId.name,
                symbol: crypto.cryptoId.symbol,
                current_price: crypto.cryptoId.current_price,
                price_change_24h: crypto.cryptoId.price_change_24h,
                marketCap: crypto.cryptoId.marketCap,
                total_volume: crypto.cryptoId.total_volume,
                images: crypto.cryptoId.images
            }))
        });

    } catch (error) {
        console.error('Error fetching list details:', error);
        res.status(500).json({ message: 'Failed to fetch list details' });
    }
});

// Get detailed info for specific crypto
router.get('/findCryptoBy/:cryptoId', verifyToken, async (req, res) => {
    try {
        const crypto = await CryptoList.findById(req.params.cryptoId);
        
        if (!crypto) {
            return res.status(404).json({
                message: 'Cryptocurrency not found'
            });
        }

        res.json({
            cryptoId: crypto._id,
            name: crypto.name,
            symbol: crypto.symbol,
            current_price: crypto.current_price,
            marketCap: crypto.marketCap,
            price_change_24h: crypto.price_change_24h,
            high_24h: crypto.high_24h,
            low_24h: crypto.low_24h
        });

    } catch (error) {
        console.error('Error fetching crypto details:', error);
        res.status(500).json({ message: 'Failed to fetch crypto details' });
    }
});

router.delete('/delete-list/:listId', verifyToken, async (req, res) => {
    try {
        // Find and verify the list belongs to the user
        const list = await Crypto.findOne({
            _id: req.params.listId,
            userId: req.user
        });

        if (!list) {
            return res.status(404).json({
                message: 'List not found or unauthorized'
            });
        }

        // Delete the list
        await Crypto.findByIdAndDelete(req.params.listId);

        res.json({
            message: 'List deleted successfully',
            listId: req.params.listId
        });

    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({
            message: 'Failed to delete list'
        });
    }
});

router.put('/rename-list/:listId', verifyToken, async (req, res) => {
    try {
        const { newName } = req.body;
        
        if (!newName) {
            return res.status(400).json({
                message: 'New list name is required'
            });
        }

        // Check if new name already exists for this user
        const existingList = await Crypto.findOne({
            userId: req.user,
            listName: newName
        });

        if (existingList) {
            return res.status(400).json({
                message: 'A list with this name already exists'
            });
        }

        // Find and verify the list belongs to the user
        const list = await Crypto.findOne({
            _id: req.params.listId,
            userId: req.user
        });

        if (!list) {
            return res.status(404).json({
                message: 'List not found or unauthorized'
            });
        }

        // Update the list name
        list.listName = newName;
        await list.save();

        // Return the updated list with populated crypto details
        const updatedList = await Crypto.findById(list._id)
            .populate('cryptos.cryptoId');

        res.json(updatedList);

    } catch (error) {
        console.error('Error renaming list:', error);
        res.status(500).json({
            message: 'Failed to rename list'
        });
    }
});

router.post('/add-to-list/:listId', verifyToken, async (req, res) => {
    try {
        const { cryptoIds } = req.body;

        if (!cryptoIds || !Array.isArray(cryptoIds)) {
            return res.status(400).json({
                message: 'cryptoIds array is required'
            });
        }

        // Find and verify the list belongs to the user
        const list = await Crypto.findOne({
            _id: req.params.listId,
            userId: req.user
        });

        if (!list) {
            return res.status(404).json({
                message: 'List not found or unauthorized'
            });
        }

        // Verify all cryptos exist in CryptoList
        const cryptos = await CryptoList.find({
            '_id': { $in: cryptoIds }
        });

        if (cryptos.length !== cryptoIds.length) {
            return res.status(400).json({
                message: 'Some cryptocurrencies not found in the database'
            });
        }

        // Check for duplicates
        const existingCryptoIds = list.cryptos.map(c => c.cryptoId.toString());
        const newCryptoIds = cryptoIds.filter(id => !existingCryptoIds.includes(id));

        if (newCryptoIds.length === 0) {
            return res.status(400).json({
                message: 'All cryptocurrencies are already in the list'
            });
        }

        // Add new cryptos to the list
        list.cryptos.push(...newCryptoIds.map(id => ({ cryptoId: id })));
        await list.save();

        // Return updated list with populated crypto details
        const updatedList = await Crypto.findById(list._id)
            .populate('cryptos.cryptoId');

        res.json(updatedList);

    } catch (error) {
        console.error('Error adding crypto to list:', error);
        res.status(500).json({
            message: 'Failed to add cryptocurrency to list'
        });
    }
});

export default router;

/* 

*/