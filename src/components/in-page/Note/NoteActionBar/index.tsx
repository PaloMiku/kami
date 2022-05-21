import {
  MdiClockTimeThreeOutline,
  PhBookOpen,
} from 'components/universal/Icons'
import { LikeButton } from 'components/universal/LikeButton'
import { NumberRecorder } from 'components/universal/NumberRecorder'
import { RelativeTime } from 'components/universal/RelativeTime'
import {
  ActionProps,
  ArticleFooterAction,
} from 'components/widgets/ArticleAction'
import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { useStore } from 'store'
import { mood2icon, weather2icon } from 'utils'

export const NoteFooterActionBar: FC<{ id: string }> = observer(({ id }) => {
  const { noteStore } = useStore()
  const note = noteStore.get(id)

  if (!note) {
    return null
  }
  const nid = note.nid
  const { mood, weather } = note
  const isSecret = note.secret ? dayjs(note.secret).isAfter(new Date()) : false
  const isLiked = noteStore.isLiked(nid)
  const actions: ActionProps = {
    informs: [],
    actions: [
      {
        name: (
          <div className="inline-flex items-center leading-[1]">
            <div className="h-[1rem] w-[1rem] relative mr-2">
              <LikeButton
                checked={isLiked}
                width={'2rem'}
                className={
                  'absolute inset-0 -translate-y-1/2 -translate-x-1/2 transform '
                }
              />
            </div>
            <NumberRecorder number={note.count?.like || 0} />
          </div>
        ),
        color: isLiked ? '#e74c3c' : undefined,

        callback: () => {
          noteStore.like(nid)
        },
      },
    ],
  }
  {
    if (weather) {
      actions.informs!.push({
        name: weather,
        icon: weather2icon(weather),
      })
    }
    if (mood) {
      actions.informs!.push({
        name: mood,
        icon: mood2icon(mood),
      })
    }

    actions.informs!.push(
      {
        name: <RelativeTime date={note.created} />,
        icon: <MdiClockTimeThreeOutline />,
      },
      {
        name: note.count.read.toString(),
        icon: <PhBookOpen />,
      },
    )
  }

  return <>{!isSecret && <ArticleFooterAction {...actions} />}</>
})