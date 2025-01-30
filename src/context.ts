import { createContext } from 'react'
import { FullState, initial_state } from './state';
import { GenericDocumentAction } from './actions';
import { ElementFactory, GLRenderer } from '@melco/renderer';

export const DocumentStateContext = createContext<FullState>(initial_state)
DocumentStateContext.displayName = 'DocumentStateContext'

export const DocumentDispatchContext = createContext<React.Dispatch<GenericDocumentAction>>(() => {})
DocumentDispatchContext.displayName = 'DocumentDispatchContext'

export interface RendererCtxProps {
    factory?: ElementFactory,
    renderer?: GLRenderer,
    canvas?: HTMLElement,
    setFactory: (f:ElementFactory | undefined, r: GLRenderer | undefined, canvas: HTMLElement | undefined) => void 
}
export const defaultRendererProps = {
   factory: undefined as (undefined | ElementFactory),
   setFactory: (_:ElementFactory | undefined) => {}
} as RendererCtxProps;

export const RendererContext = createContext<RendererCtxProps>(defaultRendererProps);