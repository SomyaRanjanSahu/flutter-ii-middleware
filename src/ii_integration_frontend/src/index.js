import { fromHex, toHex } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { DelegationIdentity, DelegationChain } from "@dfinity/identity/lib/cjs/identity/delegation";
import { Secp256k1KeyIdentity, Secp256k1PublicKey } from "@dfinity/identity-secp256k1";


const loginButton = document.getElementById("login");
const redirectToAppButton = document.getElementById("redirect");

function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    publicKey: queryParams.get("sessionkey"),
  }
}

console.log("Public Key: ", getQueryParams().publicKey);

const appPublicKey = Secp256k1PublicKey.fromDer(fromHex(getQueryParams().publicKey));

console.log("App Public Key:", appPublicKey);

let delegationChain;

loginButton.onclick = async (e) => {
  e.preventDefault();

  let middleKeyIdentity = Secp256k1KeyIdentity.generate();
  let authClient = await AuthClient.create({
    identity: middleKeyIdentity,
  });

  await new Promise((resolve) => {
    authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `https://8dba-2401-4900-1c73-f257-fc9d-bc51-9bf4-c901.ngrok-free.app/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
      onSuccess: () => {
        resolve;
        redirectToAppButton.removeAttribute("disabled");
        loginButton.setAttribute("disabled", true);
        handleSuccessfulLogin(authClient, middleKeyIdentity);
      },
    });
  });
  return false;
};

async function handleSuccessfulLogin(authClientInstance, middleKeyIdentity) {

  const middleIdentity = authClientInstance.getIdentity();


  console.log('middle identity', middleIdentity)
  console.log('Principal', middleIdentity.getPrincipal().toString())

  // if (appPublicKey != null && middleIdentity instanceof DelegationIdentity) {
    let middleToApp = await DelegationChain.create(
      middleKeyIdentity,
      appPublicKey,
      new Date(Date.now() + 15 * 60 * 1000),
      { previous: middleIdentity.getDelegation() },
    );

    delegationChain = middleToApp;
  // } else {
  //   delegationChain = middleIdentity.getDelegation();
  // }
  
  // delegationChain = middleIdentity.getDelegation();

  console.log("Delegation Chain:", delegationChain);

  var delegationString = JSON.stringify(
    delegationChain.toJSON()
  );

  console.log("Delegation String :", delegationString);

  const encodedDelegation = encodeURIComponent(delegationString);

  console.log("Encoded Delegation:", encodedDelegation);

  redirectToAppButton.onclick = async (e) => {
    e.preventDefault();
    window.location.href = `auth://callback?del=${encodedDelegation}`;
    loginButton.removeAttribute("disabled");
  };

}