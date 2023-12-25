import { fromHex, toHex } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Ed25519PublicKey, DelegationIdentity, ECDSAKeyIdentity, DelegationChain, fromHexString } from "@dfinity/identity";

const loginButton = document.getElementById("login");
const redirectToAppButton = document.getElementById("redirect");

function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    publicKey: queryParams.get("sessionkey"),
  }
}

// alert(getQueryParams().publicKey);
console.log(getQueryParams().publicKey);

const appPublicKey = Ed25519PublicKey.fromDer(fromHex(getQueryParams().publicKey));

let delegationChain;

loginButton.onclick = async (e) => {
  e.preventDefault();

  var middleKeyIdentity = await ECDSAKeyIdentity.generate();
  let authClient = await AuthClient.create({
    identity: middleKeyIdentity,
  });

  await new Promise((resolve) => {
    authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `https://7fbd-122-179-100-169.ngrok-free.app/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
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
  console.log('middle identity', middleIdentity.getPrincipal().toString())

  if (appPublicKey != null && middleIdentity instanceof DelegationIdentity) {
    let middleToApp = await DelegationChain.create(
      middleKeyIdentity,
      appPublicKey,
      new Date(Date.now() + 15 * 60 * 1000),
      { previous: middleIdentity.getDelegation() },
    );

    delegationChain = middleToApp;
  }

  alert("Principal :", middleIdentity.getPrincipal().toString());

  var delegationString = JSON.stringify(
    delegationChain.toJSON()
  );

  const encodedDelegation = encodeURIComponent(delegationString);
    alert("encodedDelegation", encodedDelegation);
  redirectToAppButton.onclick = async (e) => {
    e.preventDefault();
    window.location.href = `auth://callback?del=${encodedDelegation}`;
    loginButton.removeAttribute("disabled");
  };

}


  // console.log(middleKeyIdentity.toJSON());
  // console.log(JSON.stringify(authClientInstance.getIdentity()));
  // console.log(authClientInstance.getIdentity());

  // console.log(middleKeyIdentity.getPrincipal().toString());
  // console.log(authClientInstance.getIdentity().getPrincipal().toString());

  // const identity = authClientInstance.getIdentity();

  

  // var identityString = JSON.stringify(middleKeyIdentity.toJSON());

  
  // const encodedIdentity = encodeURIComponent(identityString);

  // const chain = DelegationChain.fromJSON(
  //   JSON.parse(decodeURIComponent(encodedDelegation))
  // );

  // const id = DelegationIdentity.fromDelegation(authClientInstance.getIdentity(), chain);
  // console.log(id.getPrincipal().toString());
  // console.log(id.getPublicKey().toDer());

  // const newId = Ed25519KeyIdentity.generate(id.getPrincipal().toUint8Array());
  // console.log(newId.getPrincipal().toString());
  
// }

