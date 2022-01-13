import { default as classNames, default as clsx } from 'clsx'
import { observer } from 'mobx-react-lite'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAudio } from 'react-use'
import { useStore } from 'store'
import { hms, NoSSR } from 'utils'
import styles from './index.module.css'

const API_BASE_URL = 'https://api.i-meto.com/meting/api'

type MetingPayloadType = {
  author: string
  /**
   * 歌词 url
   */
  lrc: string
  /**
   * 封面 url
   */
  pic: string
  title: string
  /**
   * 音源
   */
  url: string
}

export interface MusicPlayerRef {
  play(): void
  pause(): void
  setCursor(cursor: number): void

  next(): void
  prev(): void
  seek(time: number): void
}
export const MusicMiniPlayer = forwardRef<
  MusicPlayerRef,
  {
    playlist: number[]
    hide?: boolean
    onPlayStateChange: (state: 'play' | 'pause') => void
  }
>(({ playlist, hide = false, onPlayStateChange }, ref) => {
  const len = playlist.length

  const [cur, setCur] = useState<null | (MetingPayloadType & { id: number })>(
    null,
  )

  const [cursor, setCursor] = useState(0)

  const fetchData = async (id: number, type = 'netease') => {
    if (!id) {
      return
    }
    const songApi = location.origin + '/api/netease/song'
    const stream = await fetch(`${API_BASE_URL}/?server=${type}&id=${id}`)
    const json = (await stream.json()) as MetingPayloadType[]
    const [data] = await (await fetch(songApi + '?id=' + id)).json()
    const songUrl = data.url?.replace('http://', 'https://')
    setCur({ ...json[0], id, url: songUrl })
  }

  useEffect(() => {
    fetchData(playlist[cursor])
  }, [cursor, playlist])

  useEffect(() => {
    setCur(null)
    setCursor(0)
    fetchData(playlist[0])
  }, [playlist])

  const onChangeAudio = useCallback((e) => {}, [])

  const [audioEl, state, controls] = useAudio({
    src: cur?.url || '',
    autoPlay: false,
    loop: false,
    onEnded() {
      setCursor((cursor) => {
        return ++cursor % len
      })
    },
    onLoadedData: onChangeAudio,
    // onDurationChange: onChangeAudio,
    onLoad: onChangeAudio,
  })

  useImperativeHandle(ref, () => ({
    pause: controls.pause,
    play: controls.play,
    setCursor(cursor) {
      setCursor(cursor % len)
    },
    next() {
      setCursor((c) => ++c % len)
    },
    prev() {
      setCursor((c) => --c % len)
    },
    seek(time) {
      controls.seek(time)
    },
  }))

  const handleChangePlayState = useCallback(() => {
    if (state.paused) {
      controls.play()
      onPlayStateChange('play')
    } else {
      controls.pause()
      onPlayStateChange('pause')
    }
  }, [controls, onPlayStateChange, state.paused])

  const Pic = useMemo(
    () =>
      cur?.pic && (
        <div
          className={clsx(
            styles['pic'],
            'bg-cover bg-center bg-no-repeat h-full w-full',
          )}
          style={{ backgroundImage: `url(${cur.pic})` }}
        ></div>
      ),
    [cur?.pic],
  )

  return (
    <div className={classNames(styles['player'], hide && styles['hide'])}>
      <div className={styles['root']}>
        <div className={styles['cover']}>
          {Pic}

          <div
            className={clsx(
              styles['control-btn'],
              !state.paused && styles['is-play'],
            )}
            onClick={handleChangePlayState}
          >
            {state.paused ? (
              <svg width="1em" height="1em" viewBox="0 0 24 24">
                <path
                  d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z"
                  fill="currentColor"
                ></path>
              </svg>
            ) : (
              <svg width="1em" height="1em" viewBox="0 0 32 32">
                <path
                  d="M12 6h-2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"
                  fill="currentColor"
                ></path>
                <path
                  d="M22 6h-2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"
                  fill="currentColor"
                ></path>
              </svg>
            )}
          </div>

          {cur && audioEl}
        </div>

        {/* end cover */}

        {/* tip */}
        {cur && (
          <div
            className={styles['tip']}
            onClick={() => {
              window.open(cur.url)
            }}
          >
            <p>{cur.title}</p>
            <p className="text-sm text-gray">{cur.author}</p>
            <p className="text-xs text-opacity-80">
              {hms(state.time | 0)}/{hms(state.duration | 0)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

export const _MusicMiniPlayerStoreControlled = observer(() => {
  const ref = useRef<MusicPlayerRef>(null)
  const { musicStore } = useStore()

  if (musicStore.isPlay) {
    ref.current?.play()
  } else {
    ref.current?.pause()
  }

  if (!musicStore.isHide) {
    // auto play disable
    // ref.current?.play()
  } else {
    ref.current?.pause()
  }

  const handleChangePlayState = useCallback((state: 'play' | 'pause') => {
    if (state === 'play') {
      musicStore.isPlay = true
    } else {
      musicStore.isPlay = false
    }
  }, [])

  return (
    <MusicMiniPlayer
      ref={ref}
      onPlayStateChange={handleChangePlayState}
      playlist={musicStore.list}
      hide={musicStore.isHide}
    />
  )
})

export const MusicMiniPlayerStoreControlled = NoSSR(
  _MusicMiniPlayerStoreControlled,
)
export default NoSSR(MusicMiniPlayer)