import { useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { events, GLRenderer, RenderSceneUtil, StitchElement, Point, SelectionBoxHit, SelectionBoxUtil, ElementType, RenderScene, MatrixUtil } from "@melco/renderer";
import StitchCanvas from './StitchCanvas'

import { ElementFactory, Rectangle} from "@melco/renderer";
import { SelectionData, UpdateType } from "@melco/renderer/dist/events";
import { CursorType } from "@melco/renderer/dist/events";
import { DocumentDispatchContext, DocumentStateContext, RendererContext,RendererCtxProps } from "./context";
import { createAnimationParams, FullState, modelToRenderOptions, modelToScene, modelToWireframeLayer } from "./state";
import { actions } from "./actions";
import { recalcSelectionBox } from "./asyncactions";

let wasmUrlOverride = undefined as undefined | string
if (import.meta.env.DEV) {
  wasmUrlOverride =
    wasmUrlOverride || (await import('@/../node_modules/@melco/renderer/wasm/MelcoRendererApp.wasm?url')).default
}


/** Mouse event handlers and pan/zoom should be implemented here. */
const StitchView = ({canvasId='canvas' }) => {
    const ctx = useContext(RendererContext);
    const docState = useContext(DocumentStateContext)
    const dispatch = useContext(DocumentDispatchContext)
    const callbackSceneCache = useRef({scene: null as RenderScene | null, docState: null as FullState | null})

    const scene = useMemo(() => {
      return modelToScene(docState.product, docState.view_def, docState.edit_def)
    }, [docState.product, docState.view_def, docState.edit_def])

    const renderOptions = useMemo(() => {
      return modelToRenderOptions(docState.view_def)
    }, [docState.view_def])

    const wireframeLayer = useMemo(() => {
      return modelToWireframeLayer(docState.edit_def, docState.product.design)
    }, [docState.edit_def, docState.product.design])

    const viewPort = docState.view_def.canvas_rect
  
    const animationParams = useMemo(() => {
      return createAnimationParams(docState.view_def.animation_params)
    }, [docState.view_def.animation_params])
   
    const [mouseGuestureHandler, setMouseGuestureHandler] = useState<events.EditableMouseGestureHandler | null>(null);

    const getDesignIdx = (scene: RenderScene) => {
      return scene.elements.findIndex((v) => v?.type == ElementType.DESIGN)
    }
    const configCallbacks = (m: events.EditableMouseGestureHandler, _: RendererCtxProps, factory: ElementFactory) => {
        if (m) {
         m.setViewPortUpdateFn((r: Rectangle) => {
           dispatch(actions.ChangeViewPort({value: r}));
         });
         m.setProjectUpdateFn((_: UpdateType, data: SelectionData) => {
           let designSelected = false
           let se: StitchElement | undefined
           let cacheScene = callbackSceneCache.current.scene
           let cacheDoc = callbackSceneCache.current.docState
           if (!cacheDoc) {
            return
           }
           if (cacheScene) {
            const didx = getDesignIdx(cacheScene)
            if (didx >= 0) {
              se = cacheScene.elements[didx] as StitchElement
            }
           }
           if (se && data.selectElems.length > 0) {
            designSelected = true
           }
           let currSelected = cacheDoc.edit_def.selectionData ? cacheDoc.edit_def.selectionData.designSelected : false
           let currRotate = cacheDoc.edit_def.rotationMode
           if (currSelected != designSelected || currRotate != data.isRotating) {
              dispatch(actions.ChangeSelection({designSelected: designSelected, rotationMode: data.isRotating}))
           }
          if ((!currSelected || !cacheDoc.edit_def.dragData.dragging && data.dragging && designSelected || !cacheDoc.edit_def.selectionData.selectionRect) && designSelected && ctx.renderer && cacheDoc.product.design) {
            recalcSelectionBox(ctx.renderer, cacheDoc.product.design, dispatch)
          }
           if (data.dragging && designSelected) {
            dispatch(actions.ChangeDragging({dragging: true, dragHit: data.dragHit, updateType: data.dragUpdateType, transformation: data.dragTransformation}))
           } else if (cacheDoc.edit_def.dragData.dragging) {
            dispatch(actions.ChangeDragging({dragging: false, dragHit: data.dragHit, updateType: data.dragUpdateType}))
            const sed = cacheDoc.product.design
            if (ctx.renderer && sed && designSelected) {
              const mt = sed.matrix ? MatrixUtil.multiply(data.dragTransformation, sed.matrix) : data.dragTransformation
              dispatch(actions.ModifyDesign({idempotent_idx: cacheDoc.product.design_idx, designElement: {matrix: mt}}))
              recalcSelectionBox(ctx.renderer, sed, dispatch, mt)
            }
           }
         });
         m.setElementHitFn((elem: StitchElement, pt: Point, thresholdInPts: number) => {
          if (factory) {
            return factory.elementUtil.hitTest(elem, pt.x, pt.y, thresholdInPts);
          }
          return {hit: false};
         });
         m.setSelectionBoxHitFn((pt: Point) => {
          if (factory) {
            return factory.elementUtil.hitTestSelectionBox(pt.x, pt.y);
          }
          return SelectionBoxHit.hitNothing;
         });
         m.setCurrSelectionRectFn(() => {
            if (factory) {
              return factory.elementUtil.getSelectionBoxRect();
            }
            return SelectionBoxUtil.createEmpty();
         }); 
        }
    }
    const initCallbackWrap = useCallback((f:ElementFactory | null, canvas?: HTMLElement, renderer?: GLRenderer) => {
      if (f && canvas && renderer) {
        console.log("initCallbackWrap");
        let m = new events.EditableMouseGestureHandler(false, RenderSceneUtil.createEmptyScene(), (type: CursorType, canvas: HTMLElement) => {
              if (type == CursorType.NERotate) {
                  canvas.style.cursor = "url('rotateld.cur'), pointer";
              } else if (type == CursorType.NWRotate) {
                  canvas.style.cursor = "url('rotatedr.cur'), pointer";
              } else if (type == CursorType.SERotate) {
                  canvas.style.cursor = "url('rotateul.cur'), pointer";
              } else if (type == CursorType.SWRotate) {
                  canvas.style.cursor = "url('rotateru.cur'), pointer";
              } else if (type == CursorType.NESWScale) {
                canvas.style.cursor = "nesw-resize";
              } else if (type == CursorType.NWSEScale) {
                canvas.style.cursor = "nwse-resize";
              } else if (type == CursorType.Grab) {
                canvas.style.cursor = "grab";
              } else if (type == CursorType.Grabbing) {
                canvas.style.cursor = "grabbing";
              } else if (type == CursorType.Select) {
                canvas.style.cursor = "crosshair";
              }
              else if (type == CursorType.Move) {
                canvas.style.cursor = "move";
              } else {
                canvas.style.cursor = "default";
              }
            });
        m.registerEvents(canvas, renderer);
        m.setEnableRotation(true);
        setMouseGuestureHandler(m);
        configCallbacks(m, ctx, f);
      }
      ctx.setFactory(f ? f : undefined, renderer, canvas);
    }, [ctx]);

    useEffect(() => {
        if (mouseGuestureHandler && ctx.factory) {
          configCallbacks(mouseGuestureHandler, ctx, ctx.factory);
        }
    }, [ctx, mouseGuestureHandler]);

    useEffect(() => {
        if (mouseGuestureHandler) {
          mouseGuestureHandler.editMode = docState.edit_def.editMode;
        }
    }, [docState.edit_def.editMode, mouseGuestureHandler]);
    
    useEffect(() => {
        if (mouseGuestureHandler) {
           mouseGuestureHandler.setCurrScene(scene);
           callbackSceneCache.current.scene = scene
        }
    }, [scene, mouseGuestureHandler]);

    useEffect(() => {
      callbackSceneCache.current.docState = docState
    }, [docState, mouseGuestureHandler])
    
    useEffect(() => {
        if (mouseGuestureHandler) {
           mouseGuestureHandler.setViewPort(viewPort);
        }
    }, [viewPort, mouseGuestureHandler]);
    
    useEffect(() => {
        if (mouseGuestureHandler) {
          const didx = getDesignIdx(scene)
          const selectionData = {
            selectElems: [],
            dragTransformation: MatrixUtil.identityMatrix(),
            dragging: false,
            dragHit: SelectionBoxHit.hitNothing,
            dragUpdateType: UpdateType.NONE,
            isRotating: docState.edit_def.rotationMode
          } as SelectionData
          var isSelected = false
          if (docState.edit_def.selectionData.designSelected && didx >= 0 && docState.product.design) {
            isSelected = true
            var originalMatrix = docState.product.design.matrix ? docState.product.design.matrix : MatrixUtil.identityMatrix()
            selectionData.selectElems = [{elementIndex: didx, originalTransformation: originalMatrix}]
          }
          if (isSelected && docState.edit_def.dragData.dragging) {
            selectionData.dragging = true
            selectionData.dragTransformation = docState.edit_def.dragData.drag_transformation
            selectionData.dragHit = docState.edit_def.dragData.dragHit
            selectionData.dragUpdateType = docState.edit_def.dragData.dragUpdateType
          }
          if (isSelected) {
            selectionData.dragRect = docState.edit_def.selectionData.selectionRect
          }
          mouseGuestureHandler.setSelectionData(selectionData);
        }
    }, [docState.edit_def.selectionData, docState.edit_def.dragData, docState.edit_def.rotationMode, scene, mouseGuestureHandler]);
    
    return (      
        <StitchCanvas canvasId={canvasId} initCallback={initCallbackWrap} scene={scene} viewPort={viewPort} 
          renderOptions={renderOptions} wireframeLayer={wireframeLayer} animationParams={animationParams}
           wasmUrlOverride={wasmUrlOverride} />
      );

}

export default StitchView;