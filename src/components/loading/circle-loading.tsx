
import { createStyles } from "antd-style";

interface CircleLoadingProps {
  color?: string;
  size?: string | number;
}

export function CircleLoading({ color, size }: CircleLoadingProps) {
  const { styles } = useStyles({ color, size })

  return (<span className={styles + ' circle-loading'} >
    <span className="loader__circle"></span>
    <span className="loader__circle"></span>
    <span className="loader__circle"></span>
    <span className="loader__circle"></span>
    <span className="loader__circle"></span>
  </span>);
}



const useStyles = createStyles(({ css }, props: CircleLoadingProps) => (
  css`
    --size__loader: ${props.size || '0.6em'};
    position: relative;
  display: flex;
  gap: 0.3em;
  padding-top: var(--size__loader);
  &::before {
    /* content: ""; */
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 2em;
    filter: blur(45px);
    background-color: ${props.color || '#e299ff'};
    background-image: radial-gradient(at 52% 57%, hsla(11,83%,72%,1) 0px, transparent 50%),
    radial-gradient(at 37% 57%, hsla(175,78%,66%,1) 0px, transparent 50%);
  }

  .loader__circle {
    width: var(--size__loader);
    height: var(--size__loader);
    border-radius: 50%;
    animation: loader__circle__jumping 2s infinite;
    background-color:  ${props.color || '#b499ff'};
  }

  .loader__circle:nth-child(2n) {
    animation-delay: 300ms;
    background-color:  ${props.color || '#e299ff'};
  }

  .loader__circle:nth-child(3n) {
    animation-delay: 600ms;
  }

  @keyframes loader__circle__jumping {
    0%, 100% {
      transform: translateY(0px);
    }

    25% {
      transform: translateY(-15px) scale(0.5);
    }

    50% {
      transform: translateY(0px);
    }

    75% {
      transform: translateY(5px) scale(0.9);
    }
  }
  `
))