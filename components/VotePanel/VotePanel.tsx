import { useHasVoteTimeExpired } from '../../hooks/useHasVoteTimeExpired'
import useRealm from '../../hooks/useRealm'
import { ProposalState } from '@solana/spl-governance'
import { GoverningTokenRole } from '@solana/spl-governance'
import { BanIcon } from '@heroicons/react/solid'

import useWalletStore from '../../stores/useWalletStore'
import useVotePluginsClientStore from 'stores/useVotePluginsClientStore'
import Tooltip from '@components/Tooltip'
import { VotingClientType } from '@utils/uiTypes/VotePlugin'
import VetoButtons from './VetoButtons'
import { CastVoteButtons } from './CastVoteButtons'
import { YouVoted } from './YouVoted'
import { useIsVoting } from './hooks'

const VotePanel = () => {
  const client = useVotePluginsClientStore(
    (s) => s.state.currentRealmVotingClient
  )
  const { proposal, voteRecordsByVoter, tokenRole } = useWalletStore(
    (s) => s.selectedProposal
  )
  const { ownTokenRecord, ownCouncilTokenRecord, ownVoterWeight } = useRealm()
  const wallet = useWalletStore((s) => s.current)
  const connected = useWalletStore((s) => s.connected)

  // Handle state based on if a delegated wallet has already voted or not
  const ownVoteRecord =
    tokenRole === GoverningTokenRole.Community && ownTokenRecord
      ? voteRecordsByVoter[
          ownTokenRecord.account.governingTokenOwner.toBase58()
        ]
      : ownCouncilTokenRecord
      ? voteRecordsByVoter[
          ownCouncilTokenRecord.account.governingTokenOwner.toBase58()
        ]
      : wallet?.publicKey && voteRecordsByVoter[wallet.publicKey.toBase58()]

  const voterTokenRecord =
    tokenRole === GoverningTokenRole.Community
      ? ownTokenRecord
      : ownCouncilTokenRecord

  const isVoteCast = ownVoteRecord !== undefined
  const isVoting = useIsVoting()

  const hasMinAmountToVote =
    voterTokenRecord &&
    ownVoterWeight.hasMinAmountToVote(
      voterTokenRecord.account.governingTokenMint
    )

  const isVoteEnabled =
    connected && isVoting && !isVoteCast && hasMinAmountToVote

  const voteTooltipContent = !connected
    ? 'You need to connect your wallet to be able to vote'
    : !isVoting && isVoteCast
    ? 'Proposal is not in a voting state anymore.'
    : client.clientType === VotingClientType.NftVoterClient && !voterTokenRecord
    ? 'You must join the Realm to be able to vote'
    : !voterTokenRecord ||
      !ownVoterWeight.hasMinAmountToVote(
        voterTokenRecord.account.governingTokenMint
      )
    ? 'You don’t have governance power to vote in this dao'
    : ''

  const didNotVote =
    connected &&
    !!proposal &&
    !isVoting &&
    proposal.account.state !== ProposalState.Cancelled &&
    proposal.account.state !== ProposalState.Draft &&
    !isVoteCast

  return (
    <>
      <YouVoted />
      {isVoting && (
        <CastVoteButtons
          {...{
            voteTooltipContent,
            isVoteEnabled: !!isVoteEnabled,
          }}
        />
      )}
      <VetoButtons />
      {didNotVote && (
        <div className="bg-bkg-2 p-4 md:p-6 rounded-lg flex flex-col items-center justify-center">
          <h3 className="text-center mb-0">You did not vote</h3>
          <Tooltip content="You did not vote on this proposal">
            <BanIcon className="h-[34px] w-[34px] fill-white/50 mt-2" />
          </Tooltip>
        </div>
      )}
    </>
  )
}

export default VotePanel