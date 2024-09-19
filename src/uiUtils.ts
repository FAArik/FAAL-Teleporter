import {toast} from "react-toastify";


function getMinifiedHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-6)}`;
}

function toastTransactionHash(txhash: string) {
    toast(`Transaction Successful With ${getMinifiedHash(txhash)}. Click to see on snowtrace`, {
        type: "success",
        pauseOnHover: true,
        autoClose: 5000,
        onClick: () => window.open(`https://testnet.snowtrace.io/tx/${txhash}`, "_blank"),
    });
}

export default toastTransactionHash;