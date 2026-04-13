import BoardClientPage from './BoardClientPage'

type Params = Promise<{
  boardId: string
}>

const BoardPage = async ({ params }: { params: Params }) => {
  const { boardId } = await params
  return <BoardClientPage boardId={boardId} />
}

export default BoardPage
