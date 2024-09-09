const mongoose = require('mongoose');
const axios=require('axios');
const express=require('express');
const app=express();
const cors=require('cors');
require('dotenv').config();

const tokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  pinataUrl: { type: String, required: true }
});
const Token = mongoose.model('Token', tokenSchema);
app.use(cors());
app.use(express.json());
let finalData=[];
let timestamp=Date.now();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected!"))
  .catch(err => console.log(err));


app.get('/get-nft-data', (req, res) => {
const currentTime = Date.now();
if ((currentTime - timestamp) < 1500000 &&finalData.length > 0) {
    return res.json(finalData);
}
finalData=[];
timestamp=Date.now();
const nftIds = ['cryptopunks', 'bored-ape-yacht-club', 'mutant-ape-yacht-club', 'meebits', 'kanpai-pandas', 'cool-cats', 'world-of-women', 'cryptoadz', 'pudgy-penguins', 'deadfellaz'];
  const options = {
    headers: {
      accept: 'application/json',
      'x-cg-api-key': process.env.X_CG_API_KEY
    }
  };
  
  const baseUrl = 'https://api.coingecko.com/api/v3/nfts/';
  nftIds.forEach((id) => {
  const url = `${baseUrl}${id}`;
  axios.get(url, options)
    .then(response => {
      const data = response.data;
      const img = data.image.small;
      const floor = parseData(data.floor_price.native_currency+"");
      const symbol = data.native_currency_symbol;
      const volume = parseData(data.volume_24h.native_currency+"");
      const name=data.name;
      const currData = JSON.stringify({
        "img": img,
        "floorPrice": floor,
        "symbol": symbol,
        "volume": volume,
        "name":name
      });
    //   console.log(parseData(data.volume_24h.native_currency));
      finalData.push(currData);
    })
    .catch(error => {
      console.error('Error fetching data for ID:', id, error);
    });
})
function parseData(price){
  let val = price.split('.');
    let finalPrice = val[0]; 
    if (val.length > 1) {
        finalPrice += finalPrice+'.'+val[1].slice(0, 2);
    }

    return finalPrice;
}
return res.json(finalData);
})
app.post('/add-to-db',async (req,res)=>{
try {
    const { tokenId, pinataUrl } = req.body;
    const newToken = new Token({ tokenId, pinataUrl });
    await newToken.save();
    return res.json("Success");
  } catch (error) {
    console.error(error);
    return res.status(500).json("Error saving to database");
  }
})
app.get('/get-all-urls',async (req,res)=>{
   try {
     const tokens = await Token.find({}, 'tokenId pinataUrl -_id'); 
      return res.json(tokens);
  } catch (error) {
    console.error(error);
    return res.status(500).json("Error retrieving data");
  }
})

app.get('/get-specific-data/:params', async (req, res) => {
  let { params } = req.params;
  params=params+"";
  try {
    const data = await Token.findOne({ tokenId:params });

    if (!data) {
      return res.json({
    imageUrl: "",
    name: 'Unique NFT Art',
    title: 'The Artistic Masterpiece',
    price: '2.5'});
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});
app.post('/sold/:tokenId', async (req, res) => {
  try {
    const data = await Token.findOneAndDelete({ tokenId: req.params.tokenId });
    if (!data) {
      return res.json("Not found");
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});
app.listen(3004,()=>{
    console.log("listening on port 3004")
})


