import { fromHex, toHex } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Ed25519PublicKey, DelegationIdentity, ECDSAKeyIdentity, DelegationChain } from "@dfinity/identity";

const loginButton = document.getElementById("login");
const redirectToAppButton = document.getElementById("redirect");

function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    publicKey: queryParams.get("sessionkey"),
  }
}

console.log("Public Key: ", getQueryParams().publicKey);

// const appPublicKey = Ed25519PublicKey.fromDer(fromHex(getQueryParams().publicKey));

// console.log("App Public Key:", appPublicKey);

let delegationChain;

loginButton.onclick = async (e) => {
  e.preventDefault();

  // var middleKeyIdentity = await ECDSAKeyIdentity.generate();
  let middleKeyIdentity = new ECDSAKeyIdentity(
    {publicKey: fromHex(getQueryParams().publicKey)},
    fromHex(getQueryParams().publicKey),
    null,
  );
  let authClient = await AuthClient.create({
    identity: middleKeyIdentity,
  });

  await new Promise((resolve) => {
    authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `https://7b5a-171-76-59-100.ngrok-free.app/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
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
  //   let middleToApp = await DelegationChain.create(
  //     middleKeyIdentity,
  //     appPublicKey,
  //     new Date(Date.now() + 15 * 60 * 1000),
  //     { previous: middleIdentity.getDelegation() },
  //   );

  //   delegationChain = middleToApp;
  // }
  
  delegationChain = middleIdentity.getDelegation();

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