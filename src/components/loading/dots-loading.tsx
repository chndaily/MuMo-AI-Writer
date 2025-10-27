
import { createStyles } from "antd-style";

interface CircleLoadingProps {
  color?: string;
  size?: string | number;
  className?: string;
}

export function DotsLoading({ color, size, className }: CircleLoadingProps) {
  const { styles } = useStyles({ color, size })

  return (<span className={styles + ' dots-loading ' + className} >
    <span className="dot"></span>
    <span className="dot"></span>
    <span className="dot"></span>
    <span className="dot"></span>
    <span className="dot"></span>
  </span>);
}



const useStyles = createStyles(({ css }, props: CircleLoadingProps) => (
  css`
    --size__loader: ${props.size || '5px'};
  position: relative;
  display: flex;
  gap: 0.5em;
  .dot{
  width: var(--size__loader);
  height: var(--size__loader);
  border-radius: 100%;
  /* box-shadow: 0 0 10px ${props.color || '#FFECBA'}; */
  background: ${props.color || '#FFECBA'};
  transform: scale(2);
  animation: dots__jumping 1s infinite linear;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;  
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

.dot:nth-child(4) {
  animation-delay: 0.4s;
}

.dot:nth-child(5) {
  animation-delay: 0.5s;
}
  
  @keyframes dots__jumping {
    50% {
      transform: scale(1);
    }
  }
  `
))