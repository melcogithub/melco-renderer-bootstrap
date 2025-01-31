import { ImageElement, Matrix, MatrixUtil, Rectangle, StitchElement, SelectionBoxHit } from "@melco/renderer";
import { FullState, LoadStatus } from "./state";
import { produce } from "immer";
import { UpdateType } from "@melco/renderer/dist/events";

declare type PayloadAction<P = void, T extends string = string> = {
    payload: P;
    type: T;
};

export const nextId = (() => {
    var nextId = 0
    return () => {
        nextId = nextId + 1
        return nextId
    }
})()

// Collection of function which mutate state using actions.  State should always be wrapped with
// immer before calling any of these functions
const DesignMutator = {
    ChangeImage: (state: FullState, action: PayloadAction<{idx: number, status?: LoadStatus}>) => {
        if (state.product.image_idx != action.payload.idx) {
            state.product.image_idx = action.payload.idx
            state.product.image = undefined
            state.product.imageLoadStatus = action.payload.status
        }
    },
    ChangeImageDownloadStatus: (state: FullState, action: PayloadAction<{idempotent_idx: number, imageElement?: ImageElement, status: LoadStatus}>) => {
        if (state.product.image_idx == action.payload.idempotent_idx) {
            state.product.image = action.payload.imageElement
            if (action.payload.status) {
                state.product.imageLoadStatus = action.payload.status
            }
        }
    },
    ChangeDesign: (state: FullState, action: PayloadAction<{idx: number, status?: LoadStatus}>) => {
        if (state.product.design_idx != action.payload.idx) {
            state.product.design_idx = action.payload.idx
            state.product.design = undefined
            state.product.designLoadStatus = action.payload.status
        }
    },
    ModifyDesign: (state: FullState, action: PayloadAction<{idempotent_idx: number, designElement: Partial<StitchElement>}>) => {
        if (state.product.design_idx == action.payload.idempotent_idx && state.product.design) {
            state.product.design = {
                ...state.product.design,
                ...action.payload.designElement
            }
        }
    },
    ChangeDesignDownloadStatus: (state: FullState, action: PayloadAction<{idempotent_idx: number, designElement?: StitchElement, status: LoadStatus}>) => {
        if (state.product.design_idx == action.payload.idempotent_idx) {
            state.product.design = action.payload.designElement
            if (action.payload.status) {
                state.product.designLoadStatus = action.payload.status
            }
        }
    }
}

const ViewMutator = {
    Toggle3d: (state: FullState, action: PayloadAction<{value: boolean}>) => {
        state.view_def.enable_3d = action.payload.value
    },
    ToggleTwists: (state: FullState, action: PayloadAction<{value: boolean}>) => {
        state.view_def.enable_twists = action.payload.value
    },
    SetEditMode: (state: FullState, action: PayloadAction<{value: boolean}>) => {
        state.edit_def.editMode = action.payload.value
    },
    ChangeViewPort: (state: FullState, action: PayloadAction<{value: Rectangle, animationDurationMs?: number, currTime?: number}>) => {
        state.view_def.canvas_rect = action.payload.value
        if (action.payload.animationDurationMs && action.payload.currTime) {
            state.view_def.animation_params = {
                durationMs: action.payload.animationDurationMs,
                createTime: action.payload.currTime
            }
        } else {
            state.view_def.animation_params = undefined
        }
    },
    ChangeSelection: (state: FullState, action: PayloadAction<{designSelected: boolean, rotationMode?: boolean}>) => {
        if (action.payload.rotationMode !== undefined) {
            state.edit_def.rotationMode = action.payload.rotationMode
        }
        state.edit_def.selectionData.designSelected = action.payload.designSelected
    },
    ChangeSelectionRectangle: (state: FullState, action: PayloadAction<{selectionRectangle?: Rectangle}>) => {
        state.edit_def.selectionData.selectionRect = action.payload.selectionRectangle
    },
    DeselectAll(state: FullState, _: PayloadAction<{}>) {
        state.edit_def.dragData.dragging = false
        state.edit_def.selectionData.designSelected = false
        state.edit_def.dragData.dragUpdateType = UpdateType.NONE
    },
    ChangeDragging: (state: FullState, action: PayloadAction<{dragging: boolean, dragHit: SelectionBoxHit, updateType: UpdateType, transformation?: Matrix}>) => {
        state.edit_def.dragData.dragging = action.payload.dragging
        state.edit_def.dragData.dragHit = action.payload.dragHit
        state.edit_def.dragData.dragUpdateType = action.payload.updateType
        state.edit_def.dragData.drag_transformation = action.payload.transformation ? action.payload.transformation : MatrixUtil.identityMatrix()
    }
}
const DocumentMutator = {
    ...DesignMutator,
    ...ViewMutator
}
type DocumentType = typeof DocumentMutator
type DocumentActionType = keyof DocumentType
export type GenericDocumentAction = PayloadAction<unknown, DocumentActionType>

function createReducer() {
    let actionFunctionMap = new Map<string, (state: FullState, action: PayloadAction<unknown>) => void>();
    function CreateActionCreator<P>(fn: (state: FullState, action: PayloadAction<P>) => void) {
        const key = fn.name || 'Fn-' + nextId().toString()
        console.log(key)
        actionFunctionMap.set(key, fn as (state: FullState, action: PayloadAction<unknown>) => void)
        return (payload: P) => {return {type: key as DocumentActionType, payload: payload}}
    }
    const actions = {
        ChangeImage: CreateActionCreator(DocumentMutator.ChangeImage),
        ChangeImageDownloadStatus: CreateActionCreator(DocumentMutator.ChangeImageDownloadStatus),
        ChangeDesign: CreateActionCreator(DocumentMutator.ChangeDesign),
        ChangeDesignDownloadStatus: CreateActionCreator(DocumentMutator.ChangeDesignDownloadStatus),
        ModifyDesign: CreateActionCreator(DocumentMutator.ModifyDesign),
        Toggle3dAction: CreateActionCreator(DocumentMutator.Toggle3d),
        ToggleTwists: CreateActionCreator(DocumentMutator.ToggleTwists),
        SetEditMode: CreateActionCreator(DocumentMutator.SetEditMode),
        ChangeViewPort: CreateActionCreator(DocumentMutator.ChangeViewPort),
        ChangeSelection: CreateActionCreator(DocumentMutator.ChangeSelection),
        ChangeSelectionRectangle: CreateActionCreator(DocumentMutator.ChangeSelectionRectangle),
        ChangeDragging: CreateActionCreator(DocumentMutator.ChangeDragging),
        DeselectAll: CreateActionCreator(DocumentMutator.DeselectAll)
    }
    function reducer(state: FullState, action: GenericDocumentAction) {
        return produce(state, draft => {
            return actionFunctionMap.get(action.type)?.(draft, action)
        })
    }

    return {
        reducer,
        actions
    }
}

// export reducer and actions
export const { reducer, actions } = createReducer()
