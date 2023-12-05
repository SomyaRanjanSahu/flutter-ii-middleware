import {
  createActor,
  ii_integration_backend,
} from "../../declarations/ii_integration_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { DelegationIdentity } from "@dfinity/identity";

let actor = ii_integration_backend;

const loginButton = document.getElementById("login");
const redirectToAppButton = document.getElementById("redirect");

loginButton.onclick = async (e) => {
  e.preventDefault();
  let authClient = await AuthClient.create();
  await new Promise((resolve) => {
    authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `https://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
      onSuccess: () => {
        resolve;
        redirectToAppButton.removeAttribute("disabled");
        loginButton.setAttribute("disabled", true);
        handleSuccessfulLogin(authClient);
      },
    });
  });
  return false;
};

async function handleSuccessfulLogin(authClientInstance) {
  const identity = authClientInstance.getIdentity();
  const agent = new HttpAgent({ identity });
  actor = createActor(process.env.CANISTER_ID_II_INTEGRATION_BACKEND, {
    agent,
  });

  let authData = {
    expiration: '',
    pubkey: '',
    signature: '',
    principal: identity.getPrincipal().toString(),
    status: 'true'
  };

  if (identity instanceof DelegationIdentity) {
    const delegationChain = identity.getDelegation();

    // Check if there's at least one delegation
    if (delegationChain && delegationChain.delegations && delegationChain.delegations.length > 0) {
      const firstSignedDelegation = delegationChain.delegations[0];
      const firstDelegation = firstSignedDelegation.delegation;

      // Converting BigInt to string for expiration
      authData.expiration = firstDelegation.expiration.toString();
      // Converting ArrayBuffer to hex string for public key
      authData.pubkey = Buffer.from(firstDelegation.pubkey).toString('hex');
      // Converting signature to hex string
      authData.signature = Buffer.from(firstSignedDelegation.signature).toString('hex');
    }
  }

  const queryString = `expiration=${authData.expiration}&pubkey=${authData.pubkey}&signature=${authData.signature}&principal=${authData.principal}&status=${authData.status}`;

  redirectToAppButton.onclick = () => {
    window.location.href = `auth://callback?${queryString}`;
    loginButton.removeAttribute("disabled");
  };
}