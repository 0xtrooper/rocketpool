import { artifacts } from '../../test/_utils/artifacts';
import pako from 'pako';

const hre = require('hardhat');

const networkContracts = {
    rocketMegapoolDelegate: artifacts.require('RocketMegapoolDelegate'),
    rocketMegapoolFactory: artifacts.require('RocketMegapoolFactory'),
    rocketMegapoolProxy: artifacts.require('RocketMegapoolProxy'),
    rocketMegapoolManager: artifacts.require('RocketMegapoolManager'),
    rocketNodeManager: artifacts.require('RocketNodeManager'),
    rocketNodeDeposit: artifacts.require('RocketNodeDeposit'),
    rocketNodeStaking: artifacts.require('RocketNodeStaking'),
    rocketDepositPool: artifacts.require('RocketDepositPool'),
    linkedListStorage: artifacts.require('LinkedListStorage'),
    rocketDAOProtocol: artifacts.require('RocketDAOProtocol'),
    rocketDAOProtocolProposals: artifacts.require('RocketDAOProtocolProposals'),
    rocketDAOProtocolSettingsNode: artifacts.require('RocketDAOProtocolSettingsNode'),
    rocketDAOProtocolSettingsDeposit: artifacts.require('RocketDAOProtocolSettingsDeposit'),
    rocketDAOProtocolSettingsNetwork: artifacts.require('RocketDAOProtocolSettingsNetwork'),
    rocketDAOProtocolSettingsSecurity: artifacts.require('RocketDAOProtocolSettingsSecurity'),
    rocketDAOProtocolSettingsMegapool: artifacts.require('RocketDAOProtocolSettingsMegapool'),
    rocketDAOSecurityProposals: artifacts.require('RocketDAOSecurityProposals'),
    rocketNetworkRevenues: artifacts.require('RocketNetworkRevenues'),
    rocketNetworkBalances: artifacts.require('RocketNetworkBalances'),
    rocketNetworkSnapshots: artifacts.require('RocketNetworkSnapshots'),
    rocketVoterRewards: artifacts.require('RocketVoterRewards'),
    blockRoots: artifacts.require('BlockRoots'),
    beaconStateVerifier: artifacts.require('BeaconStateVerifier'),
    rocketNodeDistributorDelegate: artifacts.require('RocketNodeDistributorDelegate'),

    rocketUpgradeOneDotFour: artifacts.require('RocketUpgradeOneDotFour'),
};

if (process.env.CHAIN === 'hardhat') {
    // Unit test helper contracts
    networkContracts.beaconStateVerifier = artifacts.require('BeaconStateVerifierMock');
    networkContracts.blockRoots = artifacts.require('BlockRootsMock');
}

function compressABI(abi) {
    return Buffer.from(pako.deflate(JSON.stringify(abi))).toString('base64');
}

export async function deployUpgrade(rocketStorageAddress) {
    let contracts = {};
    let addresses = {};
    let upgradeContract;

    const genesisBlockTimestamp = 1695902400n;
    const secondsPerSlot = 12n;
    const beaconRootsHistoryBufferLength = 8191n;
    const slotsPerHistoricalRoot = 8192n;
    const beaconRoots = '0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02';
    const forkSlots = [
        74240n * 32n,   // Altair
        144896n * 32n,  // Bellatrix
        194048n * 32n,  // Capella
        269568n * 32n,  // Deneb
        364032n * 32n,  // Electra
    ]

    // Deploy other contracts
    for (let contract in networkContracts) {
        // Only deploy if it hasn't been deployed already like a precompiled
        let instance;
        const abi = networkContracts[contract].abi;

        switch (contract) {
            // Contracts with no constructor args
            case 'rocketMinipoolDelegate':
            case 'rocketNodeDistributorDelegate':
                instance = await networkContracts[contract].clone();
                addresses[contract] = instance.target;
                break;

            case 'rocketMegapoolDelegate':
                instance = await networkContracts[contract].clone(rocketStorageAddress, genesisBlockTimestamp);
                addresses[contract] = instance.target;
                break;

            case 'beaconStateVerifier':
                if (process.env.CHAIN === 'hardhat') {
                    instance = await networkContracts[contract].new(rocketStorageAddress);
                } else {
                    instance = await networkContracts[contract].clone(rocketStorageAddress, slotsPerHistoricalRoot, forkSlots);
                }
                addresses[contract] = instance.target;
                break;

            case 'blockRoots':
                if (process.env.CHAIN === 'hardhat') {
                    instance = await networkContracts[contract].new();
                } else {
                    instance = await networkContracts[contract].new(genesisBlockTimestamp, secondsPerSlot, beaconRootsHistoryBufferLength, beaconRoots);
                }
                addresses[contract] = instance.target;
                break;

            // Upgrade contract
            case 'rocketUpgradeOneDotFour':
                instance = await networkContracts[contract].new(rocketStorageAddress);

                const args = [
                    [
                        addresses.rocketMegapoolDelegate,
                        addresses.rocketMegapoolFactory,
                        addresses.rocketMegapoolProxy,
                        addresses.rocketMegapoolManager,
                        addresses.rocketNodeManager,
                        addresses.rocketNodeDeposit,
                        addresses.rocketNodeStaking,
                        addresses.rocketDepositPool,
                        addresses.linkedListStorage,
                        addresses.rocketDAOProtocol,
                        addresses.rocketDAOProtocolProposals,
                        addresses.rocketDAOProtocolSettingsNode,
                        addresses.rocketDAOProtocolSettingsDeposit,
                        addresses.rocketDAOProtocolSettingsNetwork,
                        addresses.rocketDAOProtocolSettingsSecurity,
                        addresses.rocketDAOProtocolSettingsMegapool,
                        addresses.rocketDAOSecurityProposals,
                        addresses.rocketNetworkRevenues,
                        addresses.rocketNetworkBalances,
                        addresses.rocketNetworkSnapshots,
                        addresses.rocketVoterRewards,
                        addresses.blockRoots,
                        addresses.beaconStateVerifier,
                        addresses.rocketNodeDistributorDelegate,
                    ],
                    [
                        compressABI(networkContracts.rocketMegapoolDelegate.abi),
                        compressABI(networkContracts.rocketMegapoolFactory.abi),
                        compressABI(networkContracts.rocketMegapoolProxy.abi),
                        compressABI(networkContracts.rocketMegapoolManager.abi),
                        compressABI(networkContracts.rocketNodeManager.abi),
                        compressABI(networkContracts.rocketNodeDeposit.abi),
                        compressABI(networkContracts.rocketNodeStaking.abi),
                        compressABI(networkContracts.rocketDepositPool.abi),
                        compressABI(networkContracts.linkedListStorage.abi),
                        compressABI(networkContracts.rocketDAOProtocol.abi),
                        compressABI(networkContracts.rocketDAOProtocolProposals.abi),
                        compressABI(networkContracts.rocketDAOProtocolSettingsNode.abi),
                        compressABI(networkContracts.rocketDAOProtocolSettingsDeposit.abi),
                        compressABI(networkContracts.rocketDAOProtocolSettingsNetwork.abi),
                        compressABI(networkContracts.rocketDAOProtocolSettingsSecurity.abi),
                        compressABI(networkContracts.rocketDAOProtocolSettingsMegapool.abi),
                        compressABI(networkContracts.rocketDAOSecurityProposals.abi),
                        compressABI(networkContracts.rocketNetworkRevenues.abi),
                        compressABI(networkContracts.rocketNetworkBalances.abi),
                        compressABI(networkContracts.rocketNetworkSnapshots.abi),
                        compressABI(networkContracts.rocketVoterRewards.abi),
                        compressABI(networkContracts.blockRoots.abi),
                        compressABI(networkContracts.beaconStateVerifier.abi),
                        compressABI(networkContracts.rocketNodeDistributorDelegate.abi),
                    ],
                ];
                await instance.set(...args);
                upgradeContract = instance;
                break;

            // All other contracts - pass storage address
            default:
                instance = await networkContracts[contract].clone(rocketStorageAddress);
                addresses[contract] = instance.target;
                break;
        }

        contracts[contract] = {
            instance: instance,
            address: instance.target,
            abi: abi,
        };
    }

    return upgradeContract;
}
