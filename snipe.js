const { TokenAmount } = require("@pancakeswap-libs/sdk");
const ethers = require("ethers"),
  chalk = require("chalk");
require("dotenv").config();
let choseMode = 1;
choseMode =
  "2" == process.env.Mode ? 2 : "3" == process.env.Mode ? 3 : process.env.Mode;
const TokenContract = process.env.TokenContract,
  tokenDecimals = process.env.tokenDecimals,
  amountIn = ethers.utils.parseUnits(process.env.InputToken_To_Use, "ether"),
  amountOutMin = ethers.utils.parseUnits(process.env.slippage, "ether"),
  gasPrice = ethers.utils.parseUnits(process.env.Gwei, "gwei"),
  gasLimit = process.env.Gas,
  txNumberForAntiBot = process.env.TransactionsToDo,
  providerKey = process.env.ProviderKey,
  privateKey = process.env.privateKey;
let expected = parseInt(process.env.liquidityBNB).toFixed(0);
const transactionToDetect = parseInt(
    process.env.TransactionsToFrontRun
  ).toFixed(0),
  skipBlock = process.env.skipBlock,
  countDown = convertToSeconds(process.env.countDown);

let passed = 0,
  needApproval = !1;
"true" == process.env.ApproveToken && (needApproval = !0);
let priceProtection = !1;
"true" == process.env.PriceCheck && (priceProtection = !0);
let detectDxSale = !1;
"true" == process.env.detectDxSale && (detectDxSale = !0);
let detectFairLaunch = !1;
"true" == process.env.detectFairLaunch && (detectFairLaunch = !0);
let buyOnly = !1;
"true" == process.env.buyOnlyMode && (buyOnly = !0);
let snipeOnly = !1;
"true" == process.env.snipeOnlyMode && (snipeOnly = !0);
let approveBeforeOrAfter = 1;
"2" == process.env.approveBeforeOrAfter && (approveBeforeOrAfter = 2);
let instantSell = !1;
"true" == process.env.instantSell && (instantSell = !0);
let antiRug = !1;
"true" == process.env.antiRug && (antiRug = !0);

let honeypot = false;
if (process.env.HoneypotCheck == "true") {
  honeypot = true;
}
const delaySell = process.env.sellDelay,
  multiply = parseInt(process.env.MultiplyGas);
let delayOnSellMs = 1e3 * delaySell,
  currentNonce = 0,
  antiBotMultiTx = !1;
"true" == process.env.AntiBot && (antiBotMultiTx = !0);
const spam = (process.env.SpamTransaction === "true");
const BNB = "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
  BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  pcsRouterV2Addr = "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  pcsRouterV3Addr = "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  factoryRouter = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  factoryRouterV3 = "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  ISwapRouterAddr = "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  // addLiquidityETH = "0xf305d719",
  // addLiquidity = "0xe8e33700",
  // addLiquidityDxsale = "0x267dd102",
  // removeLiquidity = "0xbaa2abde",
  // removeLiquidityETH = "0x02751cec",
  // removeLiquidityETHSupportingFeeOnTransferTokens = "0xaf2979eb",
  // removeLiquidityETHWithPermit = "0xded9382a",
  // removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = "0x5b0d5984",
  // removeLiquidityWithPermit = "0x2195995c",
  token = TokenContract.toLowerCase().substring(2),
  tokenAddress = "0x" + token;

const swapRouterAbi = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH9","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactInputParams","name":"params","type":"tuple"}],"name":"exactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactInputSingleParams","name":"params","type":"tuple"}],"name":"exactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactOutputParams","name":"params","type":"tuple"}],"name":"exactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactOutputSingleParams","name":"params","type":"tuple"}],"name":"exactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"refundETH","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowed","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowedIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"sweepTokenWithFee","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"unwrapWETH9WithFee","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}];
// const swapRouterAbi = [{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactInputSingleParams","name":"params","type":"tuple"}],"name":"exactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"}];
// const factoryV3Abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint24","name":"fee","type":"uint24"},{"indexed":true,"internalType":"int24","name":"tickSpacing","type":"int24"}],"name":"FeeAmountEnabled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":true,"internalType":"uint24","name":"fee","type":"uint24"},{"indexed":false,"internalType":"int24","name":"tickSpacing","type":"int24"},{"indexed":false,"internalType":"address","name":"pool","type":"address"}],"name":"PoolCreated","type":"event"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"}],"name":"createPool","outputs":[{"internalType":"address","name":"pool","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"}],"name":"enableFeeAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint24","name":"","type":"uint24"}],"name":"feeAmountTickSpacing","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"parameters","outputs":[{"internalType":"address","name":"factory","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"}];
var inputToken = "WBNB";
if (process.env.InputToken == "BNB") inputToken = BNB;
else if (process.env.InputToken == "BUSD") inputToken = BUSD;
else if (process.env.InputToken == "WBNB") inputToken = WBNB;
else {
  console.log(
    chalk.black.bgRed(
      "You can use only both of BNB, WBNB or BUSD as InputToken. \n"
    )
  ),
  process.exit(0)
}

async function getNonce(e) {
  return await provider.getTransactionCount(e);
}

const isLiquidityInRange = function (e, o) {
  o = parseFloat(o);
  const n = parseInt(o).toString(),
    t = ethers.utils.parseUnits(n, "ether");
  return e.value.gte(t);
};

async function getTokenBalance(e, o, n) {
  const t = new ethers.Contract(
    e,
    [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "_owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
        constant: !0,
        payable: !1,
      },
    ],
    n
  );
  return await t.balanceOf(o);
}

async function getInputTokenBalance(e, o, n) {
  if (e === BNB) {
    let balance = await n.getBalance(o);
    return balance
  } else {
    const t = new ethers.Contract(
      e,
      [
        {
          name: "balanceOf",
          type: "function",
          inputs: [{ name: "_owner", type: "address" }],
          outputs: [{ name: "balance", type: "uint256" }],
          constant: !0,
          payable: !1,
        },
      ],
      n
    );
    return await t.balanceOf(o);
  }
}

const provider = new ethers.providers.WebSocketProvider(providerKey),
  wallet = new ethers.Wallet(privateKey),
  myAddress = wallet.address,
  account = wallet.connect(provider);
provider.removeAllListeners();

const pcsRouterV3B = new ethers.Contract(pcsRouterV3Addr, swapRouterAbi, account);

const pcsRouterV2B = new ethers.Contract(
    pcsRouterV2Addr,
    [
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
    ],
    account
  ),
  pcsRouterV2 = new ethers.Contract(
    pcsRouterV2Addr,
    [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    ],
    account
  ),
  tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    account
  );

const pcsRouterV3 = new ethers.Contract(
  pcsRouterV3Addr,
  [
    "function exactInputSingle((address tokenIn,address tokenOut,uint fee,address recipient,uint deadline,uint amountIn,uint amountOut,uint sqrtPriceLimitX96) params) external payable returns (uint amountOut)",
  ],
  account
);
// console.log(pcsRouterV3B)
// pcsRouterV3 = new ethers.Contract(
//   pcsRouterV3Addr,
//   [
//     "function exactInputSingle(ISwapRouter.ExactInputSingleParams params) external payable override returns (uint256 amountOut)",
//   ],
//   account
// )

// function iAmKira() {
//   return "wss://withered-wild-fire.bsc.quiknode.pro/12e605c719b8f9125bb6f4f4427cf7ceb13f2c47/";
// }

const monitorRugPull = async function (e, o) {
  console.log(chalk.red("Monitoring for rug pull in progress ....\n")),
    provider.on("pending", async (n) => {
      const t = await provider.getTransaction(n);
      if (
        null != t &&
        t.data.includes(token) &&
        ( t.data.includes("0xbaa2abde") || //removeLiquidity
          t.data.includes("0x02751cec") || //removeLiquidityETH
          t.data.includes("0xaf2979eb") || //removeLiquidityETHSupportingFeeOnTransferTokens
          t.data.includes("0xded9382a") || //removeLiquidityETHWithPermit
          t.data.includes("0x5b0d5984") || //removeLiquidityETHWithPermitSupportingFeeOnTransferTokens
          t.data.includes("0x2195995c"))   //removeLiquidityWithPermit
      ) {
        console.log(chalk.red("Rug pull detected\n"));
        const n = t.gasLimit.mul(2),
          s = t.gasPrice.mul(2);
        console.log(chalk.red("Start selling all tokens"));
        
          let flag = false;
          do {
            try {
              if (!flag) console.log("Sending transaction...")
              else console.log("Resending transaction...")
              // if (inputToken === BNB ) {
              //   const a = await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
              //     e,
              //     amountOutMin,
              //     [tokenAddress, WBNB],
              //     myAddress,
              //     Date.now() + 6e5,
              //     { gasLimit: n, gasPrice: s, nonce: o++ }
              //   );
              //   await a.wait();
              // } else {
              //   const a = await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
              //     e,
              //     amountOutMin,
              //     [tokenAddress, inputToken],
              //     myAddress,
              //     Date.now() + 6e5,
              //     { gasLimit: n, gasPrice: s, nonce: o++ }
              //   );
              //   await a.wait();
              // }
              const e = await pcsRouterV3B.exactInputSingle(
                {
                  tokenIn: tokenAddress,
                  tokenOut: inputToken,
                  fee: 3000,
                  recipient: myAddress,
                  deadline: Date.now() + 6e5,
                  amountIn: e,
                  amountOutMinimum: amountOutMin,
                  sqrtPriceLimitX96: 0
                },
                {
                  gasLimit: n,
                  gasPrice: s,
                  nonce: o++
                }
              );
              await e.wait()
              flag = false;
            } catch (error) {
              if (spam) flag = true;
              else {
                console.log("Transaction Error:" + error);
                process.exit(1)
              }
            }
          } while (flag && spam)
        console.log(
            chalk.green("Successfully sold all the tokens before rug pull !\n")
          ),
          console.log("You can check the transaction here:"),
          console.log(`https://bscscan.com/address/${myAddress}`),
          console.log("\n"),
          process.exit(0);
      }
    });
};

if (
  (console.log(
    chalk.black.bgGreen(
      "Welcome to Ultima. Visit our website at https://ultima-bot.com. You are now using Ultima Pro."
    ) + "\n"
  ),
  console.log(
    chalk.black.bgRed(
      "We are not responsible if you bought this from a reseller and not directly from us at https://t.me/ultimabotpro. Doing it will result in no updates and no support if the bot is not operative anymore. \n"
    )
  ),
  2 == choseMode)
)
  (detectDxSale && detectFairLaunch) || (!detectDxSale && !detectFairLaunch)
    ? (console.log(
        chalk.black.bgRed(
          "You must set up EITHER detectDxSale or detectFairLaunch to true in the setup file. Program shutting down. \n"
        )
      ),
      process.exit(0))
    : detectDxSale
    ? (async () => {
        const e = new ethers.Contract(
          factoryRouterV3,
          [
            "event PoolCreated(address indexed token0, address indexed token1, uint fee, int tickSpacing, address pool)",
            "function getPool(address tokenA, address tokenB, uint fee) external view returns (address pool)",
          ],
          account
        );
        currentNonce = await getNonce(myAddress);
        let o = await getInputTokenBalance(inputToken, myAddress, provider);
        if (
          (console.log(
            chalk.cyan(
              "For Support contact developer on https://t.me/ultimabotpro. \n"
            )
          ),
          ((!buyOnly && !snipeOnly) || (buyOnly && snipeOnly)) &&
            (console.log(
              chalk.black.bgRed(
                "You must set up EITHER buyOnlyMode or snipeOnlyMode to true in the setup file. Program shutting down. \n"
              )
            ),
            process.exit(0)),
          snipeOnly
            ? console.log(
                chalk.black.bgYellow(
                  "WARNING: This Sniper mode detects only listings with presale (DxSale). \n"
                )
              )
            : buyOnly &&
              console.log(
                chalk.black.bgYellow(
                  "WARNING: You are now using Buy Only Mode Token. \n"
                )
              ),
          console.log(chalk.green("Connected to blockchain... \n")),
          console.log(chalk.magenta("Sniper started with current settings:")),
          console.log(
            chalk.green(
              "Buy token for " +
                chalk.yellow(amountIn / 1e18) + 
                ` ${process.env.InputToken} using ` +
                chalk.yellow(gasLimit) +
                " Gas and " +
                chalk.yellow(gasPrice / 1e9) +
                " Gwei"
            )
          ),
          console.log(
            chalk.green(
              `Total ${inputToken} balance is ${chalk.yellow(
                parseFloat(ethers.utils.formatUnits(o, 18)).toFixed(6)
              )}\n`
            )
          ),
          needApproval
            ? console.log("Approve token: " + chalk.green("YES"))
            : console.log("Approve token: " + chalk.red("NO")),
          buyOnly
            ? console.log("Buy only mode token: " + chalk.green("YES"))
            : snipeOnly &&
              console.log(
                "Snipe only mode token: " +
                  chalk.green("YES") +
                  " // Listing from " +
                  chalk.green("DxSale") +
                  "\nSkip blocks: " +
                  chalk.green(skipBlock)
              ),
          antiBotMultiTx
            ? (console.log("AntiBot active: " + chalk.green("YES")),
              console.log(
                "Multiple transactions set to: " +
                  chalk.green(txNumberForAntiBot)
              ))
            : (console.log("AntiBot active: " + chalk.red("NO")),
              console.log(
                "Multiple transactions forced to: " + chalk.green("1")
              )),
          instantSell
            ? (console.log("Instant Sell token: " + chalk.green("YES")),
              console.log(
                "Selling will be done after " +
                  chalk.yellow(delaySell) +
                  " second(s) from buy confirmation!"
              ))
            : console.log("Instant Sell token: " + chalk.red("NO")),
          console.log(
            `Your current nonce is: ${chalk.yellow(currentNonce)}\n`
          ),
          console.log(
            chalk.black.bgRed(
              "Please press CTRL + C to stop the bot if the settings are incorrect! \n"
            )
          ),
          needApproval && 1 == approveBeforeOrAfter)
        ) {
          console.log(chalk.green("Start approving token..."));
          try {
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                const e = await tokenContract.approve(
                  pcsRouterV3Addr,
                  ethers.BigNumber.from(
                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                  ),
                  { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
              console.log(chalk.green("Token spending approved. \n"));
          } catch (e) {
            console.log(e),
              console.log(
                chalk.red(
                  "Unexpected error on approving, token is not approved !!! \n"
                )
              );
          }
        }
        if (buyOnly) {
          if (honeypot) {
            console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          }
          if (1 == antiBotMultiTx && 0 == passed) {
            for (i = 0; i < txNumberForAntiBot - 1; i++) {
              console.log(
                chalk.green("Start buying token..." + chalk.yellow(i + 1))
              );
              let flag = false;
              do {
                try {
                  if (!flag) console.log("Sending transaction...")
                  else console.log("Resending transaction...")
                  // if (inputToken === BNB) {
                  //   await pcsRouterV2B.swapExactETHForTokens(
                  //     amountOutMin,
                  //     [WBNB, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     {
                  //       value: amountIn,
                  //       gasLimit: gasLimit,
                  //       gasPrice: gasPrice,
                  //       nonce: currentNonce++,
                  //     }
                  //   );
                  // } else {
                  //   await pcsRouterV2B.swapExactTokensForTokens(
                  //     amountIn,
                  //     amountOutMin,
                  //     [inputToken, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     {
                  //       gasLimit: gasLimit,
                  //       gasPrice: gasPrice,
                  //       nonce: currentNonce++,
                  //     }
                  //   );
                  // }
                  await pcsRouterV3B.exactInputSingle(
                    {
                      tokenIn: inputToken,
                      tokenOut: tokenAddress,
                      fee: 3000,
                      recipient: myAddress,
                      deadline: Date.now() + 6e5,
                      amountIn: amountIn,
                      amountOutMinimum: amountOutMin,
                      sqrtPriceLimitX96: 0
                    },
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++
                    }
                  );
                  flag = false;
                } catch (error) {
                  if (spam) flag = true;
                  else {
                    console.log("Transaction Error:" + error);
                    process.exit(1)
                  }
                }
              } while (flag && spam)
            }
            console.log(
              chalk.green("Start buying token...") +
                chalk.yellow(txNumberForAntiBot)
            );
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const e = await pcsRouterV2B.swapExactETHForTokens(
                //     amountOutMin,
                //     [WBNB, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }else {
                //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                //     amountIn,
                //     amountOutMin,
                //     [inputToken, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }
                const e = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: inputToken,
                    tokenOut: tokenAddress,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            (passed = 1);
          } else {
            console.log(chalk.green("Start buying token..."));
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const e = await pcsRouterV2B.swapExactETHForTokens(
                //     amountOutMin,
                //     [WBNB, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }else {
                //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                //     amountIn,
                //     amountOutMin,
                //     [inputToken, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }
                const e = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: inputToken,
                    tokenOut: tokenAddress,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            (passed = 1);
          }
          console.log(chalk.green("Successfully bought the token!\n"));
          let e = await getTokenBalance(tokenAddress, myAddress, provider);
          if (
            (console.log(
              chalk.green(
                `Total Token balance is ${chalk.yellow(
                  parseFloat(
                    ethers.utils.formatUnits(e, tokenDecimals)
                  ).toFixed(6)
                )}\n`
              )
            ),
            needApproval && 2 == approveBeforeOrAfter)
          ) {
            console.log(chalk.green("Start approving token..."));
            try {
              let flag = false;
              do {
                try {
                  if (!flag) console.log("Sending transaction...")
                  else console.log("Resending transaction...")
                  const e = await tokenContract.approve(
                    pcsRouterV3Addr,
                    ethers.BigNumber.from(
                      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                    ),
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++,
                    }
                  );
                  await e.wait(),
                  flag = false;
                } catch (error) {
                  if (spam) flag = true;
                  else {
                    console.log("Transaction Error:" + error);
                    process.exit(1)
                  }
                }
              } while (flag && spam)
                console.log(chalk.green("Token spending approved. \n"));
            } catch (e) {
              console.log(e),
                console.log(
                  chalk.red(
                    "Unexpected error on approving, token is not approved !!! \n"
                  )
                );
            }
          }
          if (instantSell) {
            console.log(
              chalk.green(
                "Start selling all tokens in " +
                  chalk.yellow(delaySell) +
                  " second(s)"
              )
            ),
              await new Promise((e) => setTimeout(e, delayOnSellMs));
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const o =
                //   await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                //     e,
                //     amountOutMin,
                //     [tokenAddress, WBNB],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {
                //       gasLimit: gasLimit,
                //       gasPrice: gasPrice,
                //       nonce: currentNonce++,
                //     }
                //   );
                //   await o.wait()
                // } else {
                //   const o =
                //   await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                //     e,
                //     amountOutMin,
                //     [tokenAddress, inputToken],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {
                //       gasLimit: gasLimit,
                //       gasPrice: gasPrice,
                //       nonce: currentNonce++,
                //     }
                //   );
                //   await o.wait()
                // }
                const o = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: tokenAddress,
                    tokenOut: inputToken,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: e,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await o.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            console.log(chalk.green("Successfully sold all the tokens !\n")),
              console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
          } else
            console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
        } else {
          if (honeypot) {
            console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          }
          (pairDetect = await e.getPool(inputToken, tokenAddress, 3000)),
            console.log("Scanning pair Address: " + chalk.yellow(pairDetect)),
            console.log(chalk.green("Waiting for liquidity to be added! ")),
            new ethers.Contract(
              pairDetect,
              [
                "event Mint(address indexed sender, uint amount0, uint amount1)",
              ],
              account
            ).on("Mint", async (e, o, n) => {
              if (
                (console.log(
                  chalk.green("Liquidity detected, starting snipe! ")
                ),
                1 == antiBotMultiTx && 0 == passed)
              ) {
                for (i = 0; i < txNumberForAntiBot - 1; i++) {
                  console.log(
                    chalk.green("Start buying token..." + chalk.yellow(i + 1))
                  );
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      // if (inputToken === BNB) {
                      //   await pcsRouterV2B.swapExactETHForTokens(
                      //     amountOutMin,
                      //     [WBNB, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     {
                      //       value: amountIn,
                      //       gasLimit: gasLimit,
                      //       gasPrice: gasPrice,
                      //       nonce: currentNonce++,
                      //     }
                      //   );
                      // } else {
                      //   await pcsRouterV2B.swapExactTokensForTokens(
                      //     amountIn,
                      //     amountOutMin,
                      //     [inputToken, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     {
                      //       gasLimit: gasLimit,
                      //       gasPrice: gasPrice,
                      //       nonce: currentNonce++,
                      //     }
                      //   );
                      // }
                      await pcsRouterV3B.exactInputSingle(
                        {
                          tokenIn: inputToken,
                          tokenOut: tokenAddress,
                          fee: 3000,
                          recipient: myAddress,
                          deadline: Date.now() + 6e5,
                          amountIn: amountIn,
                          amountOutMinimum: amountOutMin,
                          sqrtPriceLimitX96: 0
                        },
                        {
                          gasLimit: gasLimit,
                          gasPrice: gasPrice,
                          nonce: currentNonce++
                        }
                      );
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                }
                console.log(
                  chalk.green(
                    "Start buying token..." + chalk.yellow(txNumberForAntiBot)
                  )
                );
                let flag = false;
                do {
                  try {
                    if (!flag) console.log("Sending transaction...")
                    else console.log("Resending transaction...")
                    // if (inputToken === BNB) {
                    //   const e = await pcsRouterV2B.swapExactETHForTokens(
                    //     amountOutMin,
                    //     [WBNB, tokenAddress],
                    //     myAddress,
                    //     Date.now() + 6e5,
                    //     {value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                    //   );
                    //   await e.wait();
                    // }else {
                    //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                    //     amountIn,
                    //     amountOutMin,
                    //     [inputToken, tokenAddress],
                    //     myAddress,
                    //     Date.now() + 6e5,
                    //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                    //   );
                    //   await e.wait();
                    // }
                    const e = await pcsRouterV3B.exactInputSingle(
                      {
                        tokenIn: inputToken,
                        tokenOut: tokenAddress,
                        fee: 3000,
                        recipient: myAddress,
                        deadline: Date.now() + 6e5,
                        amountIn: amountIn,
                        amountOutMinimum: amountOutMin,
                        sqrtPriceLimitX96: 0
                      },
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++
                      }
                    );
                    await e.wait()
                    flag = false;
                  } catch (error) {
                    if (spam) flag = true;
                    else {
                      console.log("Transaction Error:" + error);
                      process.exit(1)
                    }
                  }
                } while (flag && spam)
                (passed = 1);
              } else {
                console.log(chalk.green("Start buying token..."));
                let flag = false;
                do {
                  try {
                    if (!flag) console.log("Sending transaction...")
                    else console.log("Resending transaction...")
                    // if (inputToken === BNB) {
                    //   const e = await pcsRouterV2B.swapExactETHForTokens(
                    //     amountOutMin,
                    //     [WBNB, tokenAddress],
                    //     myAddress,
                    //     Date.now() + 6e5,
                    //     {value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                    //   );
                    //   await e.wait();
                    // }else {
                    //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                    //     amountIn,
                    //     amountOutMin,
                    //     [inputToken, tokenAddress],
                    //     myAddress,
                    //     Date.now() + 6e5,
                    //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                    //   );
                    //   await e.wait();
                    // }
                    const e = await pcsRouterV3B.exactInputSingle(
                      {
                        tokenIn: inputToken,
                        tokenOut: tokenAddress,
                        fee: 3000,
                        recipient: myAddress,
                        deadline: Date.now() + 6e5,
                        amountIn: amountIn,
                        amountOutMinimum: amountOutMin,
                        sqrtPriceLimitX96: 0
                      },
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++
                      }
                    );
                    await e.wait()
                    flag = false;
                  } catch (error) {
                    if (spam) flag = true;
                    else {
                      console.log("Transaction Error:" + error);
                      process.exit(1)
                    }
                  }
                } while (flag && spam)
                (passed = 1);
              }
              console.log(chalk.green("Successfully bought the token!\n"));
              const t = await getTokenBalance(
                tokenAddress,
                myAddress,
                provider
              );
              if (
                (console.log(
                  chalk.green(
                    `Total Token balance is ${chalk.yellow(
                      parseFloat(
                        ethers.utils.formatUnits(t, tokenDecimals)
                      ).toFixed(6)
                    )}\n`
                  )
                ),
                needApproval && 2 == approveBeforeOrAfter)
              ) {
                console.log(chalk.green("Start approving token..."));
                try {
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      const e = await tokenContract.approve(
                        pcsRouterV3Addr,
                        ethers.BigNumber.from(
                          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                        ),
                        {
                          gasLimit: gasLimit,
                          gasPrice: gasPrice,
                          nonce: currentNonce++,
                        }
                      );
                      await e.wait()
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                  console.log(chalk.green("Token spending approved. \n"));
                } catch (e) {
                  console.log(e),
                    console.log(
                      chalk.red(
                        "Unexpected error on approving, token is not approved !!! \n"
                      )
                    );
                }
              }
              if (instantSell) {
                console.log(
                  chalk.green(
                    "Start selling all tokens in " +
                      chalk.yellow(delaySell) +
                      " second(s)"
                  )
                ),
                  await new Promise((e) => setTimeout(e, delayOnSellMs));
                let flag = false;
                do {
                  try {
                    if (!flag) console.log("Sending transaction...")
                    else console.log("Resending transaction...")
                    // if (inputToken === BNB) {
                    //   const e =
                    //     await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    //       t,
                    //       amountOutMin,
                    //       [tokenAddress, WBNB],
                    //       myAddress,
                    //       Date.now() + 6e5,
                    //       {
                    //         gasLimit: gasLimit,
                    //         gasPrice: gasPrice,
                    //         nonce: currentNonce++,
                    //       }
                    //     );
                    //     await e.wait()
                    //   } else {
                    //     const e =
                    //     await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    //       t,
                    //       amountOutMin,
                    //       [tokenAddress, inputToken],
                    //       myAddress,
                    //       Date.now() + 6e5,
                    //       {
                    //         gasLimit: gasLimit,
                    //         gasPrice: gasPrice,
                    //         nonce: currentNonce++,
                    //       }
                    //     );
                    //     await e.wait()
                    //   }
                    const e = await pcsRouterV3B.exactInputSingle(
                      {
                        tokenIn: tokenAddress,
                        tokenOut: inputToken,
                        fee: 3000,
                        recipient: myAddress,
                        deadline: Date.now() + 6e5,
                        amountIn: t,
                        amountOutMinimum: amountOutMin,
                        sqrtPriceLimitX96: 0
                      },
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++
                      }
                    );
                    await e.wait()
                    flag = false;
                  } catch (error) {
                    if (spam) flag = true;
                    else {
                      console.log("Transaction Error:" + error);
                      process.exit(1)
                    }
                  }
                } while (flag && spam)
                console.log(
                    chalk.green("Successfully sold all the tokens !\n")
                  ),
                  console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
              } else
                console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
            });
        }
      })()
    : detectFairLaunch &&
      (async () => {
        currentNonce = await getNonce(myAddress);
        let e = await getInputTokenBalance(inputToken, myAddress, provider);
        if (
          (console.log(
            chalk.cyan(
              "For Support contact developer on https://t.me/ultimabotpro. \n"
            )
          ),
          ((!buyOnly && !snipeOnly) || (buyOnly && snipeOnly)) &&
            (console.log(
              chalk.black.bgRed(
                "You must set up EITHER buyOnlyMode or snipeOnlyMode to true in the setup file. Program shutting down. \n"
              )
            ),
            process.exit(0)),
          snipeOnly
            ? console.log(
                chalk.black.bgYellow(
                  "WARNING: This Sniper mode detects only Fair Launch. \n"
                )
              )
            : buyOnly &&
              console.log(
                chalk.black.bgYellow(
                  "WARNING: You are now using Buy Only Mode Token. \n"
                )
              ),
          console.log(chalk.green("Connected to blockchain... \n")),
          console.log(chalk.magenta("Sniper started with current settings:")),
          console.log(
            chalk.green(
              "Buy token for " +
                chalk.yellow(amountIn / 1e18) +
                `${process.env.InputToken} using...` +
                chalk.yellow(gasLimit) +
                " Gas and " +
                chalk.yellow(gasPrice / 1e9) +
                " Gwei"
            )
          ),
          console.log(
            chalk.green(
              `Total ${process.env.InputToken} balance is ${chalk.yellow(
                parseFloat(ethers.utils.formatUnits(e, 18)).toFixed(6)
              )}\n`
            )
          ),
          needApproval
            ? console.log("Approve token: " + chalk.green("YES"))
            : console.log("Approve token: " + chalk.red("NO")),
          buyOnly
            ? console.log("Buy only mode token: " + chalk.green("YES"))
            : snipeOnly &&
              console.log(
                "Snipe only mode token: " +
                  chalk.green("YES") +
                  " // Fees Multiplication X " +
                  chalk.yellow(multiply) +
                  "\nSkip blocks: " +
                  chalk.green(skipBlock)
              ),
          antiBotMultiTx
            ? (console.log("AntiBot active: " + chalk.green("YES")),
              console.log(
                "Multiple transactions set to: " +
                  chalk.yellow(txNumberForAntiBot)
              ))
            : (console.log("AntiBot active: " + chalk.red("NO")),
              console.log(
                "Multiple transactions forced to: " + chalk.yellow("1")
              )),
          priceProtection
            ? (console.log("Price Protection active: " + chalk.green("YES")),
              console.log("Expected Liquidity : " + chalk.yellow(expected)))
            : console.log("Price Protection active: " + chalk.red("NO")),
          1 == antiRug && 0 == instantSell
            ? console.log("Rug Pull Protection active: " + chalk.green("YES"))
            : console.log("Rug Pull Protection active: " + chalk.red("NO")),
          instantSell
            ? (console.log("Instant Sell token: " + chalk.green("YES")),
              console.log(
                "Selling will be done after " +
                  chalk.yellow(delaySell) +
                  " second(s) from buy confirmation!"
              ))
            : console.log("Instant Sell token: " + chalk.red("NO")),
          console.log(
            `Your current nonce is: ${chalk.yellow(currentNonce)}\n`
          ),
          console.log(
            chalk.black.bgRed(
              "Please press CTRL + C to stop the bot if the settings are incorrect! \n"
            )
          ),
          needApproval && 1 == approveBeforeOrAfter)
        ) {
          console.log(chalk.green("Start approving token..."));
          try {
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                const e = await tokenContract.approve(
                  pcsRouterV3Addr,
                  ethers.BigNumber.from(
                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                  ),
                  { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            console.log(chalk.green("Token spending approved. \n"));
          } catch (e) {
            console.log(e),
              console.log(
                chalk.red(
                  "Unexpected error on approving, token is not approved !!! \n"
                )
              );
          }
        }
        if (buyOnly) {
          if (honeypot) {
            console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          }
          if (1 == antiBotMultiTx && 0 == passed) {
            for (i = 0; i < txNumberForAntiBot - 1; i++) {
              console.log(
                chalk.green("Start buying token..." + chalk.yellow(i + 1))
              );
              let flag = false;
              do {
                try {
                  if (!flag) console.log("Sending transaction...")
                  else console.log("Resending transaction...")
                  // if (inputToken === BNB) {
                  //   await pcsRouterV2B.swapExactETHForTokens(
                  //     amountOutMin,
                  //     [WBNB, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     {
                  //       value: amountIn,
                  //       gasLimit: gasLimit,
                  //       gasPrice: gasPrice,
                  //       nonce: currentNonce++,
                  //     }
                  //   );
                  // } else {
                  //   await pcsRouterV2B.swapExactTokensForTokens(
                  //     amountIn,
                  //     amountOutMin,
                  //     [inputToken, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     {
                  //       gasLimit: gasLimit,
                  //       gasPrice: gasPrice,
                  //       nonce: currentNonce++,
                  //     }
                  //   );
                  // }
                  await pcsRouterV3B.exactInputSingle(
                    {
                      tokenIn: inputToken,
                      tokenOut: tokenAddress,
                      fee: 3000,
                      recipient: myAddress,
                      deadline: Date.now() + 6e5,
                      amountIn: amountIn,
                      amountOutMinimum: amountOutMin,
                      sqrtPriceLimitX96: 0
                    },
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++
                    }
                  );
                  await e.wait()
                  flag = false;
                } catch (error) {
                  if (spam) flag = true;
                  else {
                    console.log("Transaction Error:" + error);
                    process.exit(1)
                  }
                }
              } while (flag && spam)
            }
            console.log(
              chalk.green("Start buying token...") +
                chalk.yellow(txNumberForAntiBot)
            );
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const e = await pcsRouterV2B.swapExactETHForTokens(
                //     amountOutMin,
                //     [WBNB, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }else {
                //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                //     amountIn,
                //     amountOutMin,
                //     [inputToken, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }
                const e = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: inputToken,
                    tokenOut: tokenAddress,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            (passed = 1);
          } else {
            console.log("start point")
            console.log(chalk.green("Start buying token..."));
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const e = await pcsRouterV2B.swapExactETHForTokens(
                //     amountOutMin,
                //     [WBNB, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     { value: amountIn, gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // } else {
                //   const e = await pcsRouterV2B.swapExactTokensForTokens(
                //     amountIn,
                //     amountOutMin,
                //     [inputToken, tokenAddress],
                //     myAddress,
                //     Date.now() + 6e5,
                //     { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                //   );
                //   await e.wait();
                // }
                const e = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: inputToken,
                    tokenOut: tokenAddress,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            (passed = 1);
          }
          console.log(chalk.green("Successfully bought the token!\n"));
          let e = await getTokenBalance(tokenAddress, myAddress, provider);
          if (
            (console.log(
              chalk.green(
                `Total Token balance is ${chalk.yellow(
                  parseFloat(
                    ethers.utils.formatUnits(e, tokenDecimals)
                  ).toFixed(6)
                )}\n`
              )
            ),
            needApproval && 2 == approveBeforeOrAfter)
          ) {
            console.log(chalk.green("Start approving token..."));
            try {
              let flag = false;
              do {
                try {
                  if (!flag) console.log("Sending transaction...")
                  else console.log("Resending transaction...")
                  const e = await tokenContract.approve(
                    pcsRouterV3Addr,
                    ethers.BigNumber.from(
                      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                    ),
                    { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                  );
                  await e.wait()
                  flag = false;
                } catch (error) {
                  if (spam) flag = true;
                  else {
                    console.log("Transaction Error:" + error);
                    process.exit(1)
                  }
                }
              } while (flag && spam)
              console.log(chalk.green("Token spending approved. \n"));
            } catch (e) {
              console.log(e),
                console.log(
                  chalk.red(
                    "Unexpected error on approving, token is not approved !!! \n"
                  )
                );
            }
          }
          if (instantSell) {
            console.log(
              chalk.green(
                "Start selling all tokens in " +
                  chalk.yellow(delaySell) +
                  " second(s)"
              )
            ),
              await new Promise((e) => setTimeout(e, delayOnSellMs));
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                // if (inputToken === BNB) {
                //   const o =
                //   await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                //     e,
                //     amountOutMin,
                //     [tokenAddress, WBNB],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {
                //       gasLimit: gasLimit,
                //       gasPrice: gasPrice,
                //       nonce: currentNonce++,
                //     }
                //   );
                //   await o.wait()
                // } else {
                //   const o =
                //   await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                //     e,
                //     amountOutMin,
                //     [tokenAddress, inputToken],
                //     myAddress,
                //     Date.now() + 6e5,
                //     {
                //       gasLimit: gasLimit,
                //       gasPrice: gasPrice,
                //       nonce: currentNonce++,
                //     }
                //   );
                //   await o.wait()
                // }
                const o = await pcsRouterV3B.exactInputSingle(
                  {
                    tokenIn: tokenAddress,
                    tokenOut: inputToken,
                    fee: 3000,
                    recipient: myAddress,
                    deadline: Date.now() + 6e5,
                    amountIn: e,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                  },
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++
                  }
                );
                await o.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            console.log(chalk.green("Successfully sold all the tokens !\n")),
              console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
          } else
            console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              1 == antiRug &&
                0 == instantSell &&
                (await monitorRugPull(e, currentNonce)),
              0 == antiRug && process.exit(0);
        } else
          honeypot
            ? console.log(chalk.black.bgCyan("Checking for Honeypot... \n"))
            : console.log("");

        console.log("Listening on mempool..."),
          console.log("Waiting for liquidity to be added!"),
          provider.on("pending", async (e) => {
            const o = await provider.getTransaction(e);
            if (
              (null != o &&
                o.data.includes("0xe8e33700") &&
                o.data.includes(token) &&
                0 == passed) ||
              (null != o &&
                o.data.includes("0xf305d719") &&
                o.data.includes(token) &&
                0 == passed)
            )
              if (
                (console.log(
                  chalk.green("Matching liquidity added! Start sniping!\n")
                ),
                priceProtection)
              ) {
                if (isLiquidityInRange(o, expected)) {
                  console.log(
                    chalk.green("Liquidity check passed, sniping!\n")
                  );
                  const e = o.gasLimit.mul(multiply),
                    n = o.gasPrice.mul(multiply);
                  if (1 == antiBotMultiTx && 0 == passed) {
                    for (i = 0; i < txNumberForAntiBot - 1; i++) {
                      console.log(
                        chalk.green(
                          "Start buying token..." + chalk.yellow(i + 1)
                        )
                      );
                      let flag = false;
                      do {
                        try {
                          if (!flag) console.log("Sending transaction...")
                          else console.log("Resending transaction...")
                          // if (inputToken === BNB) {
                          //   await pcsRouterV2B.swapExactETHForTokens(
                          //     amountOutMin,
                          //     [WBNB, tokenAddress],
                          //     myAddress,
                          //     Date.now() + 6e5,
                          //     {
                          //       value: amountIn,
                          //       gasLimit: e,
                          //       gasPrice: n,
                          //       nonce: currentNonce++,
                          //     }
                          //   );
                          // } else {
                          //   await pcsRouterV2B.swapExactTokensForTokens(
                          //     amountIn,
                          //     amountOutMin,
                          //     [inputToken, tokenAddress],
                          //     myAddress,
                          //     Date.now() + 6e5,
                          //     {
                          //       gasLimit: e,
                          //       gasPrice: n,
                          //       nonce: currentNonce++,
                          //     }
                          //   );
                          // }
                          await pcsRouterV3B.exactInputSingle(
                            {
                              tokenIn: inputToken,
                              tokenOut: tokenAddress,
                              fee: 3000,
                              recipient: myAddress,
                              deadline: Date.now() + 6e5,
                              amountIn: amountIn,
                              amountOutMinimum: amountOutMin,
                              sqrtPriceLimitX96: 0
                            },
                            {
                              gasLimit: e,
                              gasPrice: n,
                              nonce: currentNonce++
                            }
                          );
                          await e.wait()
                          flag = false;
                        } catch (error) {
                          if (spam) flag = true;
                          else {
                            console.log("Transaction Error:" + error);
                            process.exit(1)
                          }
                        }
                      } while (flag && spam)
                    }
                    console.log(
                      chalk.green("Start buying token...") +
                        chalk.yellow(txNumberForAntiBot)
                    );
                    let flag = false;
                    do {
                      try {
                        if (!flag) console.log("Sending transaction...")
                        else console.log("Resending transaction...")
                        // if (inputToken === BNB) {
                        //   const o = await pcsRouterV2B.swapExactETHForTokens(
                        //     amountOutMin,
                        //     [inputToken, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     {value: amountIn, gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                        //   );
                        //   await o.wait()
                        // } else {
                        //   const o = await pcsRouterV2B.swapExactTokensForTokens(
                        //     amountIn,
                        //     amountOutMin,
                        //     [inputToken, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                        //   );
                        //   await o.wait();
                        // }
                        const o = await pcsRouterV3B.exactInputSingle(
                          {
                            tokenIn: inputToken,
                            tokenOut: tokenAddress,
                            fee: 3000,
                            recipient: myAddress,
                            deadline: Date.now() + 6e5,
                            amountIn: amountIn,
                            amountOutMinimum: amountOutMin,
                            sqrtPriceLimitX96: 0
                          },
                          {
                            gasLimit: e,
                            gasPrice: n,
                            nonce: currentNonce++
                          }
                        );
                        await o.wait()
                        flag = false;
                      } catch (error) {
                        if (spam) flag = true;
                        else {
                          console.log("Transaction Error:" + error);
                          process.exit(1)
                        }
                      }
                    } while (flag && spam)
                    (passed = 1);
                  } else {
                    console.log(chalk.green("Start buying token..."));
                    let flag = false;
                    do {
                      try {
                        if (!flag) console.log("Sending transaction...")
                        else console.log("Resending transaction...")
                        // if (inputToken === BNB) {
                        //   const o = await pcsRouterV2B.swapExactETHForTokens(
                        //     amountOutMin,
                        //     [inputToken, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     {value: amountIn, gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                        //   );
                        //   await o.wait()
                        // } else {
                        //   const o = await pcsRouterV2B.swapExactTokensForTokens(
                        //     amountIn,
                        //     amountOutMin,
                        //     [inputToken, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                        //   );
                        //   await o.wait();
                        // }
                        const o = await pcsRouterV3B.exactInputSingle(
                          {
                            tokenIn: inputToken,
                            tokenOut: tokenAddress,
                            fee: 3000,
                            recipient: myAddress,
                            deadline: Date.now() + 6e5,
                            amountIn: amountIn,
                            amountOutMinimum: amountOutMin,
                            sqrtPriceLimitX96: 0
                          },
                          {
                            gasLimit: e,
                            gasPrice: n,
                            nonce: currentNonce++
                          }
                        );
                        await o.wait()
                        flag = false;
                      } catch (error) {
                        if (spam) flag = true;
                        else {
                          console.log("Transaction Error:" + error);
                          process.exit(1)
                        }
                      }
                    } while (flag && spam)
                    (passed = 1);
                  }
                  console.log(chalk.green("Successfully bought the token!\n"));
                  const t = await getTokenBalance(
                    tokenAddress,
                    myAddress,
                    provider
                  );
                  if (
                    (console.log(
                      chalk.green(
                        `Total Token balance is ${chalk.yellow(
                          parseFloat(
                            ethers.utils.formatUnits(t, tokenDecimals)
                          ).toFixed(6)
                        )}\n`
                      )
                    ),
                    needApproval && 2 == approveBeforeOrAfter)
                  ) {
                    console.log(chalk.green("Start approving token..."));
                    try {
                      let flag = false;
                      do {
                        try {
                          if (!flag) console.log("Sending transaction...")
                          else console.log("Resending transaction...")
                          const e = await tokenContract.approve(
                            pcsRouterV3Addr,
                            ethers.BigNumber.from(
                              "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                            ),
                            { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                          );
                          await e.wait()
                          flag = false;
                        } catch (error) {
                          if (spam) flag = true;
                          else {
                            console.log("Transaction Error:" + error);
                            process.exit(1)
                          }
                        }
                      } while (flag && spam)
                      console.log(chalk.green("Token spending approved. \n"));
                    } catch (e) {
                      console.log(e),
                        console.log(
                          chalk.red(
                            "Unexpected error on approving, token is not approved !!! \n"
                          )
                        );
                    }
                  }
                  if (instantSell) {
                    console.log(
                      chalk.green(
                        "Start selling all tokens in " +
                          chalk.yellow(delaySell) +
                          " second(s)"
                      )
                    ),
                      await new Promise((e) => setTimeout(e, delayOnSellMs));
                    let flag = false;
                    do {
                      try {
                        if (!flag) console.log("Sending transaction...")
                        else console.log("Resending transaction...")
                        // if (inputToken === BNB) {
                        //   const e =
                        //     await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        //       t,
                        //       amountOutMin,
                        //       [tokenAddress, WBNB],
                        //       myAddress,
                        //       Date.now() + 6e5,
                        //       {
                        //         gasLimit: gasLimit,
                        //         gasPrice: gasPrice,
                        //         nonce: currentNonce++,
                        //       }
                        //     );
                        //     await e.wait()
                        //   } else {
                        //     const e =
                        //     await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                        //       t,
                        //       amountOutMin,
                        //       [tokenAddress, inputToken],
                        //       myAddress,
                        //       Date.now() + 6e5,
                        //       {
                        //         gasLimit: gasLimit,
                        //         gasPrice: gasPrice,
                        //         nonce: currentNonce++,
                        //       }
                        //     );
                        //     await e.wait()
                        //   }
                        const e = await pcsRouterV3B.exactInputSingle(
                          {
                            tokenIn: tokenAddress,
                            tokenOut: inputToken,
                            fee: 3000,
                            recipient: myAddress,
                            deadline: Date.now() + 6e5,
                            amountIn: t,
                            amountOutMinimum: amountOutMin,
                            sqrtPriceLimitX96: 0
                          },
                          {
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                            nonce: currentNonce++
                          }
                        );
                        await e.wait()
                        flag = false;
                      } catch (error) {
                        if (spam) flag = true;
                        else {
                          console.log("Transaction Error:" + error);
                          process.exit(1)
                        }
                      }
                    } while (flag && spam)
                    console.log(
                        chalk.green("Successfully sold all the tokens !\n")
                      ),
                      console.log("You can check the transaction here:"),
                      console.log(`https://bscscan.com/address/${myAddress}`),
                      console.log("\n"),
                      process.exit(0);
                  } else
                    console.log("You can check the transaction here:"),
                      console.log(`https://bscscan.com/address/${myAddress}`),
                      console.log("\n"),
                      1 == antiRug &&
                        0 == instantSell &&
                        (await monitorRugPull(t, currentNonce)),
                      0 == antiRug && process.exit(0);
                } else
                  console.log(
                    chalk.red("Liquidity is not in expected range! Waiting...!")
                  ),
                    console.log(
                      chalk.red(
                        "Please check PooCoin and see if liquidity was added!"
                      )
                    ),
                    console.log(
                      chalk.red("https://poocoin.app/tokens/" + TokenContract)
                    ),
                    console.log(
                      chalk.red(
                        "Waiting for new liquidity, please stop the bot if you think it's a scam ! (CTRL + C)\n"
                      )
                    );
              } else {
                const e = o.gasLimit.mul(multiply),
                  n = o.gasPrice.mul(multiply);
                if (1 == antiBotMultiTx && 0 == passed) {
                  for (i = 0; i < txNumberForAntiBot - 1; i++) {
                    console.log(
                      chalk.green("Start buying token..." + chalk.yellow(i + 1))
                    );
                    let flag = false;
                    do {
                      try {
                        if (!flag) console.log("Sending transaction...")
                        else console.log("Resending transaction...")
                        // if (inputToken === BNB) {
                        //   await pcsRouterV2B.swapExactETHForTokens(
                        //     amountOutMin,
                        //     [WBNB, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     {
                        //       value: amountIn,
                        //       gasLimit: e,
                        //       gasPrice: n,
                        //       nonce: currentNonce++,
                        //     }
                        //   );
                        // } else {
                        //   await pcsRouterV2B.swapExactTokensForTokens(
                        //     amountIn,
                        //     amountOutMin,
                        //     [inputToken, tokenAddress],
                        //     myAddress,
                        //     Date.now() + 6e5,
                        //     {
                        //       gasLimit: e,
                        //       gasPrice: n,
                        //       nonce: currentNonce++,
                        //     }
                        //   );
                        // }
                        await pcsRouterV3B.exactInputSingle(
                          {
                            tokenIn: inputToken,
                            tokenOut: tokenAddress,
                            fee: 3000,
                            recipient: myAddress,
                            deadline: Date.now() + 6e5,
                            amountIn: amountIn,
                            amountOutMinimum: amountOutMin,
                            sqrtPriceLimitX96: 0
                          },
                          {
                            gasLimit: e,
                            gasPrice: n,
                            nonce: currentNonce++
                          }
                        );
                        await e.wait()
                        flag = false;
                      } catch (error) {
                        if (spam) flag = true;
                        else {
                          console.log("Transaction Error:" + error);
                          process.exit(1)
                        }
                      }
                    } while (flag && spam)
                  }
                  console.log(
                    chalk.green("Start buying token...") +
                      chalk.yellow(txNumberForAntiBot)
                  );
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      // if (inputToken === BNB) {
                      //   const o = await pcsRouterV2B.swapExactETHForTokens(
                      //     amountOutMin,
                      //     [inputToken, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     {value: amountIn, gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                      //   );
                      //   await o.wait()
                      // } else {
                      //   const o = await pcsRouterV2B.swapExactTokensForTokens(
                      //     amountIn,
                      //     amountOutMin,
                      //     [inputToken, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                      //   );
                      //   await o.wait();
                      // }
                      const o= await pcsRouterV3B.exactInputSingle(
                        {
                          tokenIn: inputToken,
                          tokenOut: tokenAddress,
                          fee: 3000,
                          recipient: myAddress,
                          deadline: Date.now() + 6e5,
                          amountIn: amountIn,
                          amountOutMinimum: amountOutMin,
                          sqrtPriceLimitX96: 0
                        },
                        {
                          gasLimit: e,
                          gasPrice: n,
                          nonce: currentNonce++
                        }
                      );
                      await o.wait()
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                  (passed = 1);
                } else if (0 == passed) {
                  console.log(chalk.green("Start buying token..."));
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      // if (inputToken === BNB) {
                      //   const o = await pcsRouterV2B.swapExactETHForTokens(
                      //     amountOutMin,
                      //     [inputToken, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     {value: amountIn, gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                      //   );
                      //   await o.wait()
                      // } else {
                      //   const o = await pcsRouterV2B.swapExactTokensForTokens(
                      //     amountIn,
                      //     amountOutMin,
                      //     [inputToken, tokenAddress],
                      //     myAddress,
                      //     Date.now() + 6e5,
                      //     { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                      //   );
                      //   await o.wait();
                      // }
                      const o = await pcsRouterV3B.exactInputSingle(
                        {
                          tokenIn: inputToken,
                          tokenOut: tokenAddress,
                          fee: 3000,
                          recipient: myAddress,
                          deadline: Date.now() + 6e5,
                          amountIn: amountIn,
                          amountOutMinimum: amountOutMin,
                          sqrtPriceLimitX96: 0
                        },
                        {
                          gasLimit: e,
                          gasPrice: n,
                          nonce: currentNonce++
                        }
                      );
                      await o.wait()
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                  (passed = 1);
                }
                console.log(chalk.green("Successfully bought the token!\n"));
                const t = await getTokenBalance(
                  tokenAddress,
                  myAddress,
                  provider
                );
                if (
                  (console.log(
                    chalk.green(
                      `Total Token balance is ${chalk.yellow(
                        parseFloat(
                          ethers.utils.formatUnits(t, tokenDecimals)
                        ).toFixed(6)
                      )}\n`
                    )
                  ),
                  needApproval && 2 == approveBeforeOrAfter)
                ) {
                  console.log(chalk.green("Start approving token..."));
                  try {
                    let flag = false;
                    do {
                      try {
                        if (!flag) console.log("Sending transaction...")
                        else console.log("Resending transaction...")
                        const e = await tokenContract.approve(
                          pcsRouterV3Addr,
                          ethers.BigNumber.from(
                            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                          ),
                          { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                        );
                        await e.wait()
                        flag = false;
                      } catch (error) {
                        if (spam) flag = true;
                        else {
                          console.log("Transaction Error:" + error);
                          process.exit(1)
                        }
                      }
                    } while (flag && spam)
                    console.log(chalk.green("Token spending approved. \n"));
                  } catch (e) {
                    console.log(e),
                      console.log(
                        chalk.red(
                          "Unexpected error on approving, token is not approved !!! \n"
                        )
                      );
                  }
                }
                if (instantSell) {
                  console.log(
                    chalk.green(
                      "Start selling all tokens in " +
                        chalk.yellow(delaySell) +
                        " second(s)"
                    )
                  ),
                    await new Promise((e) => setTimeout(e, delayOnSellMs));
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      // if (inputToken === BNB) {
                      //   const e =
                      //     await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                      //       t,
                      //       amountOutMin,
                      //       [tokenAddress, WBNB],
                      //       myAddress,
                      //       Date.now() + 6e5,
                      //       {
                      //         gasLimit: gasLimit,
                      //         gasPrice: gasPrice,
                      //         nonce: currentNonce++,
                      //       }
                      //     );
                      //     await e.wait()
                      //   } else {
                      //     const e =
                      //     await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                      //       t,
                      //       amountOutMin,
                      //       [tokenAddress, inputToken],
                      //       myAddress,
                      //       Date.now() + 6e5,
                      //       {
                      //         gasLimit: gasLimit,
                      //         gasPrice: gasPrice,
                      //         nonce: currentNonce++,
                      //       }
                      //     );
                      //     await e.wait()
                      //   }
                      const e = await pcsRouterV3B.exactInputSingle(
                        {
                          tokenIn: tokenAddress,
                          tokenOut: inputToken,
                          fee: 3000,
                          recipient: myAddress,
                          deadline: Date.now() + 6e5,
                          amountIn: t,
                          amountOutMinimum: amountOutMin,
                          sqrtPriceLimitX96: 0
                        },
                        {
                          gasLimit: gasLimit,
                          gasPrice: gasPrice,
                          nonce: currentNonce++
                        }
                      );
                      await e.wait()
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                  console.log(
                      chalk.green("Successfully sold all the tokens !\n")
                    ),
                    console.log("You can check the transaction here:"),
                    console.log(`https://bscscan.com/address/${myAddress}`),
                    console.log("\n"),
                    process.exit(0);
                } else
                  console.log("You can check the transaction here:"),
                    console.log(`https://bscscan.com/address/${myAddress}`),
                    console.log("\n"),
                    1 == antiRug &&
                      0 == instantSell &&
                      (await monitorRugPull(t, currentNonce)),
                    0 == antiRug && process.exit(0);
              }
          });
      })();
else if (1 == choseMode) {
  const e = process.env.DxSalePresaleAddress,
    o = ethers.utils.parseUnits(process.env.BNB_To_Use, "ether"),
    n = ethers.utils.parseUnits(process.env.SetGwei, "gwei"),
    t = ethers.BigNumber.from(process.env.SetGas);
  async function snipeDxSale() {
    provider.on("pending", async (s) => {
      const a = await provider.getTransaction(s);
      if (
        (process.stdout.write(
          chalk.yellow("Countdown reached 0... Scanning transactions..\r")
        ),
        (currentNonce = await getNonce(myAddress)),
        null != a && "0x" === a.data && a.to === e && "0x0" != a.value)
      ) {
        try {
          let flag = false;
          do {
            try {
              if (!flag) console.log("Sending transaction...")
              else console.log("Resending transaction...")
              const s = await account.sendTransaction({
                from: myAddress,
                to: e,
                value: o,
                gasPrice: n,
                gasLimit: t,
                nonce: currentNonce,
              });
              await s.wait();
              flag = false;
            } catch (error) {
              if (spam) flag = true;
              else {
                console.log("Transaction Error:" + error);
                process.exit(1)
              }
            }
          } while (flag && spam)
          console.log(
              chalk.yellow(
                "Sniped, please check bscscan for transaction !!! \n"
              )
            ),
            process.exit(0);
        } catch (e) {
          console.log(
            chalk.yellow("Sniped, please check bscscan for transaction !!! \n")
          );
        }
        process.exit(0);
      }
    });
  }
  console.log(
    chalk.cyanBright(
      "Scanning.. Process started with " +
        process.env.countDown +
        " before countdown..\r"
    )
  ),
    setTimeout(function () {
      console.log("\r"), snipeDxSale();
    }, 1e3 * countDown - 500);
} else
  3 == choseMode
    ? (async () => {
        if (
          ((currentNonce = await getNonce(myAddress)),
          needApproval && 1 == approveBeforeOrAfter)
        ) {
          console.log(chalk.green("Start approving token..."));
          try {
            let flag = false;
            do {
              try {
                if (!flag) console.log("Sending transaction...")
                else console.log("Resending transaction...")
                const e = await tokenContract.approve(
                  pcsRouterV3Addr,
                  ethers.BigNumber.from(
                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                  ),
                  { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                );
                await e.wait()
                flag = false;
              } catch (error) {
                if (spam) flag = true;
                else {
                  console.log("Transaction Error:" + error);
                  process.exit(1)
                }
              }
            } while (flag && spam)
            console.log(chalk.green("Token spending approved. \n"));
          } catch (e) {
            console.log(e),
              console.log(
                chalk.red(
                  "Unexpected error on approving, token is not approved !!! \n"
                )
              );
          }
        }
        console.log(
          chalk.yellow("Waiting for targeted transaction on mempool...")
        ),
          provider.on("pending", async (e) => {
            const o = await provider.getTransaction(e),
              n = 1 * Math.pow(10, 18);
            if (
              ((hexer = "0x".concat(n.toString(16))),
              (targetPrice = ethers.BigNumber.from(hexer)),
              null != o &&
                o.data.includes(token) &&
                0 == passed &&
                (o.data.includes("0x38ed1739") ||
                  o.data.includes("0x18cbafe5") ||
                  o.data.includes("0xfb3bdb41")) &&
                ((targetPriceDetected = targetPrice.lte(o.value)),
                targetPriceDetected))
            ) {
              const e = o.gasLimit.mul(2),
                n = o.gasPrice.mul(2);
              console.log(chalk.green("Start buying token..."));
              let flag = false;
              do {
                try {
                  if (!flag) console.log("Sending transaction...")
                  else console.log("Resending transaction...")
                  // if (inputToken === BNB) {
                  //   const t = await pcsRouterV2B.swapExactETHForTokens(
                  //     amountOutMin,
                  //     [inputToken, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     {value: amountIn, gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                  //   );
                  //   await to.wait()
                  // } else {
                  //   const t = await pcsRouterV2B.swapExactTokensForTokens(
                  //     amountIn,
                  //     amountOutMin,
                  //     [inputToken, tokenAddress],
                  //     myAddress,
                  //     Date.now() + 6e5,
                  //     { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                  //   );
                  //   await t.wait();
                  // }
                  const t = await pcsRouterV3B.exactInputSingle(
                    {
                      tokenIn: inputToken,
                      tokenOut: tokenAddress,
                      fee: 3000,
                      recipient: myAddress,
                      deadline: Date.now() + 6e5,
                      amountIn: amountIn,
                      amountOutMinimum: amountOutMin,
                      sqrtPriceLimitX96: 0
                    },
                    {
                      gasLimit: e,
                      gasPrice: n,
                      nonce: currentNonce++
                    }
                  );
                  await t.wait()
                  flag = false;
                } catch (error) {
                  if (spam) flag = true;
                  else {
                    console.log("Transaction Error:" + error);
                    process.exit(1)
                  }
                }
              } while (flag && spam)
              (passed = 1),
                console.log(chalk.green("Successfully bought the token!\n"));
              const s = await getTokenBalance(
                tokenAddress,
                myAddress,
                provider
              );
              if (
                (console.log(
                  chalk.green(
                    `Total Token balance is ${chalk.yellow(
                      parseFloat(
                        ethers.utils.formatUnits(s, tokenDecimals)
                      ).toFixed(6)
                    )}\n`
                  )
                ),
                needApproval && 2 == approveBeforeOrAfter)
              ) {
                console.log(chalk.green("Start approving token..."));
                try {
                  let flag = false;
                  do {
                    try {
                      if (!flag) console.log("Sending transaction...")
                      else console.log("Resending transaction...")
                      const e = await tokenContract.approve(
                        pcsRouterV3Addr,
                        ethers.BigNumber.from(
                          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                        ),
                        { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
                      );
                      await e.wait()
                      flag = false;
                    } catch (error) {
                      if (spam) flag = true;
                      else {
                        console.log("Transaction Error:" + error);
                        process.exit(1)
                      }
                    }
                  } while (flag && spam)
                  console.log(chalk.green("Token spending approved. \n"));
                } catch (e) {
                  console.log(e),
                    console.log(
                      chalk.red(
                        "Unexpected error on approving, token is not approved !!! \n"
                      )
                    );
                }
              }
              if (instantSell) {
                console.log(
                  chalk.green(
                    "Start selling all tokens in " +
                      chalk.yellow(delaySell) +
                      " second(s)"
                  )
                ),
                  await new Promise((e) => setTimeout(e, delayOnSellMs));
                let flag = false;
                do {
                  try {
                    if (!flag) console.log("Sending transaction...")
                    else console.log("Resending transaction...")
                    // if (inputToken === BNB) {
                    //   const e =
                    //     await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    //       t,
                    //       amountOutMin,
                    //       [tokenAddress, WBNB],
                    //       myAddress,
                    //       Date.now() + 6e5,
                    //       {
                    //         gasLimit: gasLimit,
                    //         gasPrice: gasPrice,
                    //         nonce: currentNonce++,
                    //       }
                    //     );
                    //     await e.wait()
                    //   } else {
                    //     const e =
                    //     await pcsRouterV2.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    //       t,
                    //       amountOutMin,
                    //       [tokenAddress, inputToken],
                    //       myAddress,
                    //       Date.now() + 6e5,
                    //       {
                    //         gasLimit: gasLimit,
                    //         gasPrice: gasPrice,
                    //         nonce: currentNonce++,
                    //       }
                    //     );
                    //     await e.wait()
                    //   }
                    const e = await pcsRouterV3B.exactInputSingle(
                      {
                        tokenIn: tokenAddress,
                        tokenOut: inputToken,
                        fee: 3000,
                        recipient: myAddress,
                        deadline: Date.now() + 6e5,
                        amountIn: t,
                        amountOutMinimum: amountOutMin,
                        sqrtPriceLimitX96: 0
                      },
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++
                      }
                    );
                    await e.wait()
                      flag = false;
                  } catch (error) {
                    if (spam) flag = true;
                    else {
                      console.log("Transaction Error:" + error);
                      process.exit(1)
                    }
                  }
                } while (flag && spam)
                console.log(
                    chalk.green("Successfully sold all the tokens !\n")
                  ),
                  console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
              } else
                console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
            }
          });
      })()
    : (console.log(
        chalk.black.bgRed(
          "Please choose the correct mode in the setup file. Program shutting down. \n"
        )
      ),
      process.exit(0));

function convertToSeconds(e) {
  var o = e.split(":");
  return 60 * +o[0] * 60 + 60 * +o[1] + +o[2];
}