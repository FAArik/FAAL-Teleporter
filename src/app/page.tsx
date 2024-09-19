"use client"

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';

import {useEffect, useState} from "react";
import {ConnectKitButton} from "connectkit";
import {ImSpinner2} from "react-icons/im";
import {useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useSendTransaction} from "wagmi";
import {getBalance} from "@wagmi/core";

import {Faal_L1, getConfig} from "@/wagmi";
import TokenHomeAbi from '@/TokenHome.json';
import TokenRemoteAbi from '@/TokenRemote.json';
import USDCAbi from '@/USDCErcAbi.json';
import toastTransactionHash from "@/uiUtils";
import {isAddress} from "viem";


export default function Home() {
    const erc20TokenHome = "0x5c1a033BAd2DD58592a0Bc260f8AF2C450a41483";
    const faalTokenRemote = "0x938466FD927eDAC91469E055B7662661924D4e99";
    const USDCAddress = "0xB6076C93701D6a07266c31066B298AeC6dd65c2d";
    const faalBlockChainId = "0xffd29400aa90c17bdf3771b1f508b1af36649fe48216ffc860534691f9ca6468";
    const cChainBlockChainId = "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5";

    const {address} = useAccount();
    const {chains, switchChain} = useSwitchChain()
    const [fromState, setFromState] = useState("cChain");
    const [toState, setToState] = useState("FAAL");
    const [amount, setAmount] = useState(0);
    const [toAddress, setToAddress] = useState("");
    var [balance, setBalance] = useState("0");

    //#region token initialization
    const tokenHome = {
        address: erc20TokenHome,
        abi: TokenHomeAbi,
    } as const

    const tokenRemote = {
        address: faalTokenRemote,
        abi: TokenRemoteAbi,
    } as const

    const usdcErc20 = {
        address: USDCAddress,
        abi: USDCAbi,
    } as const
    //#endregion

    useEffect(() => {
        switchChain({chainId: 43113});
    },[]);
    async function getChainBalance() {
        var balance;
        if (fromState == "cChain") {
            balance = await getBalance(getConfig(), {address: address!, chainId: 43113, token: USDCAddress})
            setBalance(balance.formatted.slice(0, balance.formatted.indexOf(".") + 3));
        } else {
            balance = await getBalance(getConfig(), {address: address!, chainId: Faal_L1.id,})
            setBalance(balance.formatted.slice(0, balance.formatted.indexOf(".") + 3));
        }
        return balance;
    }

    useEffect(() => {
        if (address != undefined) {
            getChainBalance();
        }
    }, [address, fromState]);

    const {
        data: writeContractResult,
        writeContractAsync: writeApprove,
        error,
    } = useWriteContract();

    const {data: approvalReceiptData, isLoading: isApproving} =
        useWaitForTransactionReceipt({
            hash: writeContractResult,
        });

    function checkIfValid(): boolean {
        var addressRef = document.getElementById("toAddress") as HTMLInputElement;
        var isValid = isAddress(addressRef!.value!);
        !isValid ? addressRef!.classList.add("is-invalid") : addressRef!.classList.remove("is-invalid");
        return isValid;
    }

    useEffect(() => {
        if (!isApproving && approvalReceiptData != undefined) {
            BridgeToFaal(amount)
            toastTransactionHash(approvalReceiptData.transactionHash);
        }
    }, [isApproving]);

    const {
        data: writeContractAsyncData,
        writeContractAsync,
    } = useWriteContract();

    const {data: bridgeTokenReceiptData, isLoading: isBridgingToken} =
        useWaitForTransactionReceipt({
            hash: writeContractAsyncData,
        });

    useEffect(() => {
        if (!isBridgingToken && bridgeTokenReceiptData != undefined) {
            getChainBalance();
            setAmount(0);
            toastTransactionHash(bridgeTokenReceiptData.transactionHash);
        }
    }, [isBridgingToken]);


    async function BridgeToken() {
        if (fromState == "cChain" && toState == "FAAL") {
            await Approve(amount);
        } else if (fromState == "FAAL" && toState == "cChain") {
            BridgeToCChain(amount);
        } else if (fromState == toState) {
            if (!checkIfValid())
                return;
            Transfer(amount);
        }
    }

    const {data: SendingTransactionHash, isPending: isSendingTransaction, sendTransaction} = useSendTransaction()

    async function Approve(amount: number) {
        await writeApprove({
            address: USDCAddress,
            abi: USDCAbi,
            functionName: "approve",
            args: [erc20TokenHome, amount * 10 ** 6]
        });
    }

    async function BridgeToFaal(amount: number) {
        await writeContractAsync({
            address: tokenHome.address,
            abi: tokenHome.abi,
            functionName: "send",
            args: [[
                faalBlockChainId, // destination blockchainId
                faalTokenRemote, // faalTokenRemote
                address, // reciever
                erc20TokenHome, // erc20TokenHome
                0, 0, 250000, "0x0000000000000000000000000000000000000000"], amount * 10 ** 6]
        });
    }

    async function BridgeToCChain(amount: number) {
        await writeContractAsync({
            address: tokenRemote.address,
            abi: tokenRemote.abi,
            functionName: "send",
            args: [[
                cChainBlockChainId, // destination blockchainId
                erc20TokenHome, //erc20TokenHome
                address, // reciever
                faalTokenRemote, // faalTokenRemote
                0, 0, 250000, "0x0000000000000000000000000000000000000000"]],
            value: BigInt(amount * 10 ** 18)
        });
    }

    async function Transfer(amount: number) {
        fromState == "cChain" ?
            await writeContractAsync({
                address: usdcErc20.address,
                abi: usdcErc20.abi,
                functionName: "transfer",
                args: [
                    toAddress,
                    amount * 10 ** 6
                ],
            }) : sendTransaction({to: toAddress as `0x${string}`, value: BigInt(amount * 10 ** 18)});
    }

    useEffect(() => {
        if (!isSendingTransaction && SendingTransactionHash != undefined) {
            getChainBalance();
            setAmount(0);
            toastTransactionHash(SendingTransactionHash);
        }
    }, [isSendingTransaction]);

    async function handleChange(e: any) {
        var inputId = e.target.id;
        var selected = e.target.value
        console.log(inputId)
        console.log(selected)
        if (inputId === "fromInput") {
            if (selected === "cChain") {
                switchChain({chainId: 43113});
                setFromState("cChain");
                setToState("FAAL");
            } else if (selected === "FAAL") {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '9031',  // 0x2347 in hex, 9031 in decimal
                            chainName: 'FAAL',
                            nativeCurrency: {
                                name: 'USD Coin',
                                symbol: 'USDC',
                                decimals: 18
                            },
                            rpcUrls: ['https://frank-rapidly-kingfish.ngrok-free.app/ext/bc/2wfeNARjnmpRyR5HAkbFoSXdkrkXhqvM8KoBQNFHt3V9h8iZpF/rpc'], /* Replace with actual RPC URL */
                            blockExplorerUrls: ['https://testnet.snowtrace.io/']
                        }]
                    });
                } catch (addError) {
                    console.error(addError);
                }
                switchChain({chainId: 9031});
                setFromState("FAAL");
                setToState("cChain");
            }
        } else if (inputId === "toInput") {
            if (selected === "cChain") {
                setToState("cChain");
            } else if (selected === "FAAL") {
                setToState("FAAL");
            }
        }
    }

    return (
        <div className="container-fluid ">
            <div className="row justify-content-center mt-5">
                <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1><i><b>FAAL</b> Teleporter</i></h1>
                        <div>
                            <ConnectKitButton.Custom>
                                {({isConnected, isConnecting, show, truncatedAddress, chain}) => {
                                    return (
                                        <button
                                            className={`btn rounded-5 p-3 btn-sm ${(isConnected && (chain?.name != "Avalanche Fuji" && chain?.name != "FAAL")) ? "btn-danger" : " btn-primary"}`}
                                            onClick={show}>
                                            {isConnecting && !isConnected ? (
                                                <ImSpinner2 className="spinner"/>
                                            ) : isConnected ? (chain?.name != "Avalanche Fuji" && chain?.name != "FAAL") ? "Wrong Network" : (
                                                truncatedAddress
                                            ) : (
                                                "Connect"
                                            )}
                                        </button>
                                    );
                                }}
                            </ConnectKitButton.Custom>
                        </div>
                    </div>
                    <div className="card bg-secondary text-light rounded-4 border-4">
                        <div className="card-header">
                            <ul className="nav nav-tabs card-header-tabs">
                                <li className="nav-item">
                                    <a className="nav-link active" aria-current="true" id="#bridge"
                                       data-bs-toggle="tab">Bridge</a>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body">
                            <form onSubmit={BridgeToken}>
                                <div className="mb-3">
                                    <label htmlFor="fromInput" className="form-label">From</label>
                                    <div className="input-group input-group-lg mb-1">
                                        <select value={fromState} onChange={event => handleChange(event)} id="fromInput"
                                                name="fromInput"
                                                className="form-control bg-dark text-white rounded-3">
                                            <option value="cChain">C-Chain</option>
                                            <option value="FAAL">FAAL Subnet</option>
                                        </select>
                                    </div>
                                    <div className="row pb-1">
                                        <div className="d-flex px-4  justify-content-end">
                                            Balance: {balance}
                                        </div>
                                    </div>
                                    <div className="input-group input-group-lg">
                                            <span className="input-group-text" id="TLP" style={{
                                                borderTopLeftRadius: '0.3rem',
                                                borderBottomLeftRadius: '0.3rem',
                                                borderTopRightRadius: '0', // No rounding
                                                borderBottomRightRadius: '0' // No rounding
                                            }}>
                                                USDC
                                            </span>
                                        <input onChange={(e) => setAmount(e.target.value as unknown as number)}
                                               value={amount}
                                               aria-describedby="TLP"
                                               className="form-control bg-dark text-white" name="amount" type="number"
                                               placeholder="0.0" style={{
                                            borderTopRightRadius: '0.3rem',
                                            borderBottomRightRadius: '0.3rem',
                                            borderTopLeftRadius: '0', // No rounding
                                            borderBottomLeftRadius: '0' // No rounding
                                        }}/>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="toInput" className="form-label">To</label>
                                    <div className="input-group input-group-lg">
                                        <select value={toState} onChange={event => handleChange(event)} id="toInput"
                                                className="form-control bg-dark text-white rounded-3">
                                            <option value="FAAL">FAAL Subnet</option>
                                            <option value="cChain">C-Chain</option>
                                        </select>
                                    </div>
                                </div>
                                {toState == fromState &&
                                    <div className="input-group input-group-lg mb-4">
                                            <span className="input-group-text" id="toAddressSpan" style={{
                                                borderTopLeftRadius: '0.3rem',
                                                borderBottomLeftRadius: '0.3rem',
                                                borderTopRightRadius: '0', // No rounding
                                                borderBottomRightRadius: '0' // No rounding
                                            }}>
                                                To Address
                                            </span>
                                        <input onChange={(e) =>
                                            setToAddress(e.target.value)
                                        } id="toAddress"
                                               aria-describedby="toAddress"
                                               className="form-control bg-dark text-white"
                                               name="toAddress"
                                               type="text"
                                               placeholder="0x..." style={{
                                            borderTopRightRadius: '0.3rem',
                                            borderBottomRightRadius: '0.3rem',
                                            borderTopLeftRadius: '0', // No rounding
                                            borderBottomLeftRadius: '0' // No rounding
                                        }}/>
                                    </div>
                                }
                                {address != undefined &&

                                    <button onClick={BridgeToken} type="button"
                                            className="btn btn-dark w-100 rounded-3">{fromState == toState ? "TRANSFER" : "BRIDGE"}
                                    </button>
                                }
                                {address == undefined &&
                                    <>
                                        <ConnectKitButton.Custom>
                                            {({isConnected, isConnecting, show, truncatedAddress, chain}) => {
                                                return (
                                                    <>
                                                        <p className="text-center mt-3">Must connect wallet to
                                                            teleport.</p>
                                                        <button type="button"
                                                                className={`btn btn-primary w-100 rounded-3 p-2 d-flex justify-content-center ${(isConnected && (chain?.name != "Avalanche Fuji" && chain?.name != "FAAL")) ? "btn-danger" : " btn-primary"}`}
                                                                onClick={show}>
                                                            {isConnecting && !isConnected ? (
                                                                <ImSpinner2 className="spinner"/>
                                                            ) : isConnected ? (chain?.name != "Avalanche Fuji" && chain?.name != "FAAL") ? "Wrong Network" : (
                                                                truncatedAddress
                                                            ) : (
                                                                "Connect"
                                                            )}
                                                        </button>
                                                    </>
                                                );
                                            }}
                                        </ConnectKitButton.Custom>
                                    </>
                                }
                            </form>
                        </div>
                    </div>

                    <footer className="container-fluid bg-dark text-white mt-5 p-4 rounded-2">
                        <div className="row ">
                            <div className="col-md-6 d-flex justify-content-center">
                                <a href="https://subnets.avax.network" target="_blank" rel="noopener noreferrer"
                                   className="d-flex align-items-center justify-content-center border border-secondary bg-dark text-white rounded p-2 hover:bg-primary hover:text-white text-decoration-none"
                                   style={{height: 40}}>
                                    <div className="d-flex align-items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                             height="24">
                                            <path d="M12 23c6.1 0 11-4.9 11-11S18.1 1 12 1 1 5.9 1 12s4.9 11 11 11z"
                                                  fill="#fff"></path>
                                            <path
                                                d="M14.4 9.7c.1-.3.1-.5 0-.8-.1-.2-.2-.5-.5-.9l-1.2-2.1c-.2-.4-.4-.7-.5-.7-.2-.1-.4-.1-.5 0-.1.1-.3.3-.5.7l-5.5 9.7c-.2.4-.4.6-.4.8 0 .2.1.4.3.5.1.1.4.1.9.1h2.3c.6 0 .8 0 1.1-.1.3-.1.5-.2.7-.4.2-.2.3-.4.6-.9l2.8-4.9c.2-.6.3-.8.4-1zm4.3 5.8L17 12.7c-.2-.4-.4-.6-.5-.7-.2-.1-.4-.1-.5 0-.2.1-.3.3-.5.7l-1.7 2.8c-.2.4-.4.6-.4.8 0 .2.1.4.3.5.1.1.4.1.9.1H18c.5 0 .7 0 .9-.1.2-.1.3-.3.3-.5-.1-.1-.2-.4-.5-.8z"
                                                fill="#000"></path>
                                        </svg>
                                        <span className="text-sm">Powered by <strong>Avalanche</strong></span>
                                    </div>
                                </a>
                            </div>
                            <div className="col-md-6 d-flex justify-content-center">
                                <a href="https://github.com/ava-labs/teleporter" target="_blank"
                                   rel="noopener noreferrer"
                                   className="d-flex align-items-center justify-content-center border border-secondary bg-dark text-white rounded p-2 hover:bg-primary hover:text-white text-decoration-none"
                                   style={{height: 40}}>
                                    <div className="d-flex align-items-center gap-2">
                                        <img src="/TeleporterLogo.svg" alt="Made possible with Teleporter"
                                             style={{height: 40}}/>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}