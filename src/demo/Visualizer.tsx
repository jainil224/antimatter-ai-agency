import { Safe3DRenderer } from '@components/3d/Safe3DRenderer'
import type { Step } from '@shared/types/Algorithm'
import { SceneSetup } from './scene'

import { ArrayBox } from '@components/3d/ArrayBox'

interface VisualizerProps {
    visualData: number[]
    steps: Step[]
    currentStepIndex: number
    showGrid?: boolean
    hideLabels?: boolean
    mode?: "student" | "classroom"
    cameraRef?: any
}

export const Visualizer = ({ visualData, steps, currentStepIndex, showGrid = true, hideLabels, cameraRef }: VisualizerProps) => {
    const currentStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null

    const getBoxColor = (_val: number, index: number) => {
        if (currentStep && currentStep.indices) {
            if (currentStep.indices.includes(index)) {
                if (currentStep.type === 'FOUND') return '#22c55e' // Green
                if (currentStep.type === 'COMPARE') return '#fbbf24' // Yellow
                return '#3b82f6' // Blue/Default Pointer
            }
        }
        return undefined
    }

    const isHighlighted = (index: number) => {
        return currentStep?.indices?.includes(index) || false
    }

    return (
        <div className="absolute inset-0">
            <Safe3DRenderer className="w-full h-full block" camera={{ position: [0, 5, 15], fov: 45 }}>
                <color attach="background" args={['#020617']} />
                <SceneSetup showGrid={showGrid} cameraRef={cameraRef} />

                <group position={[-(visualData.length * 2.5) / 2 + 1.25, 0, 0]}>
                    {visualData.map((val, i) => (
                        <ArrayBox
                            key={i}
                            index={i}
                            value={val}
                            position={[i * 2.5, 0, 0]}
                            isHighlighted={isHighlighted(i)}
                            overrideColor={getBoxColor(val, i)}
                            hideLabels={hideLabels}
                        />
                    ))}
                </group>
            </Safe3DRenderer>
        </div>
    )
}
