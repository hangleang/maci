import { IncrementalQuinTree, hash5 } from "maci-crypto";
import { PubKey, Keypair, StateLeaf, blankStateLeaf, blankStateLeafHash } from "maci-domainobjs";

import { Poll } from "./Poll";
import { STATE_TREE_ARITY } from "./utils/constants";
import { IJsonMaciState, IJsonPoll, IMaciState, MaxValues, TreeDepths } from "./utils/types";

/**
 * A representation of the MACI contract.
 */
export class MaciState implements IMaciState {
  // a MaciState can hold multiple polls
  polls: Poll[] = [];

  // in this quinary tree we hold all signups (hash of a state leaf)
  stateTree: IncrementalQuinTree;

  // the leaves of the state tree
  stateLeaves: StateLeaf[] = [];

  // how deep the state tree is
  stateTreeDepth: number;

  numSignUps = 0;

  // to keep track if a poll is currently being processed
  pollBeingProcessed?: boolean;

  currentPollBeingProcessed?: number;

  /**
   * Constructs a new MaciState object.
   * @param stateTreeDepth - The depth of the state tree.
   */
  constructor(stateTreeDepth: number) {
    this.stateTreeDepth = stateTreeDepth;
    this.stateTree = new IncrementalQuinTree(this.stateTreeDepth, blankStateLeafHash, STATE_TREE_ARITY, hash5);

    // we put a blank state leaf to prevent a DoS attack
    this.stateLeaves.push(blankStateLeaf);
    this.stateTree.insert(blankStateLeafHash);
    // we need to increase the number of signups by one given
    // that we already added the blank leaf
    this.numSignUps += 1;
  }

  /**
   * Sign up a user with the given public key, initial voice credit balance, and timestamp.
   * @param pubKey - The public key of the user.
   * @param initialVoiceCreditBalance - The initial voice credit balance of the user.
   * @param timestamp - The timestamp of the sign-up.
   * @returns The index of the newly signed-up user in the state tree.
   */
  signUp(pubKey: PubKey, initialVoiceCreditBalance: bigint, timestamp: bigint): number {
    this.numSignUps += 1;
    const stateLeaf = new StateLeaf(pubKey, initialVoiceCreditBalance, timestamp);
    const hash = stateLeaf.hash();
    this.stateTree.insert(hash);

    return this.stateLeaves.push(stateLeaf.copy()) - 1;
  }

  /**
   * Deploy a new poll with the given parameters.
   * @param pollEndTimestamp - The Unix timestamp at which the poll ends.
   * @param maxValues - The maximum number of values for each vote option.
   * @param treeDepths - The depths of the tree.
   * @param messageBatchSize - The batch size for processing messages.
   * @param coordinatorKeypair - The keypair of the MACI round coordinator.
   * @returns The index of the newly deployed poll.
   */
  deployPoll(
    pollEndTimestamp: bigint,
    maxValues: MaxValues,
    treeDepths: TreeDepths,
    messageBatchSize: number,
    coordinatorKeypair: Keypair,
  ): number {
    const poll: Poll = new Poll(
      pollEndTimestamp,
      coordinatorKeypair,
      treeDepths,
      {
        messageBatchSize,
        subsidyBatchSize: STATE_TREE_ARITY ** treeDepths.intStateTreeDepth,
        tallyBatchSize: STATE_TREE_ARITY ** treeDepths.intStateTreeDepth,
      },
      maxValues,
      this,
    );

    this.polls.push(poll);
    return this.polls.length - 1;
  }

  /**
   * Deploy a null poll.
   */
  deployNullPoll(): void {
    this.polls.push(null as unknown as Poll);
  }

  /**
   * Create a deep copy of the MaciState object.
   * @returns A new instance of the MaciState object with the same properties.
   */
  copy = (): MaciState => {
    const copied = new MaciState(this.stateTreeDepth);

    copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy());
    copied.polls = this.polls.map((x) => x.copy());

    return copied;
  };

  /**
   * Check if the MaciState object is equal to another MaciState object.
   * @param m - The MaciState object to compare.
   * @returns True if the two MaciState objects are equal, false otherwise.
   */
  equals = (m: MaciState): boolean => {
    const result =
      this.stateTreeDepth === m.stateTreeDepth &&
      this.polls.length === m.polls.length &&
      this.stateLeaves.length === m.stateLeaves.length;

    if (!result) {
      return false;
    }

    for (let i = 0; i < this.polls.length; i += 1) {
      if (!this.polls[i].equals(m.polls[i])) {
        return false;
      }
    }
    for (let i = 0; i < this.stateLeaves.length; i += 1) {
      if (!this.stateLeaves[i].equals(m.stateLeaves[i])) {
        return false;
      }
    }

    return true;
  };

  /**
   * Serialize the MaciState object to a JSON object.
   * @returns A JSON object representing the MaciState object.
   */
  toJSON(): IJsonMaciState {
    return {
      stateTreeDepth: this.stateTreeDepth,
      polls: this.polls.map((poll) => poll.toJSON()),
      stateLeaves: this.stateLeaves.map((leaf) => leaf.toJSON()),
      pollBeingProcessed: Boolean(this.pollBeingProcessed),
      currentPollBeingProcessed: this.currentPollBeingProcessed ? this.currentPollBeingProcessed.toString() : "",
      numSignUps: this.numSignUps,
    };
  }

  /**
   * Create a new MaciState object from a JSON object.
   * @param json - The JSON object representing the MaciState object.
   * @returns A new instance of the MaciState object with the properties from the JSON object.
   */
  static fromJSON(json: IJsonMaciState): MaciState {
    const maciState = new MaciState(json.stateTreeDepth);

    // assign the json values to the new instance
    maciState.stateLeaves = json.stateLeaves.map((leaf) => StateLeaf.fromJSON(leaf));
    maciState.pollBeingProcessed = json.pollBeingProcessed;
    maciState.currentPollBeingProcessed = Number.parseInt(json.currentPollBeingProcessed, 10);
    maciState.numSignUps = json.numSignUps;

    // re create the state tree (start from index 1 as in the constructor we already add the blank leaf)
    for (let i = 1; i < json.stateLeaves.length; i += 1) {
      const leaf = StateLeaf.fromJSON(json.stateLeaves[i]);
      const leafHash = leaf.hash();
      maciState.stateTree.insert(leafHash);
    }

    // re-generate the polls and set the maci state ref
    maciState.polls = json.polls.map((jsonPoll: IJsonPoll) => Poll.fromJSON(jsonPoll, maciState));
    return maciState;
  }
}
