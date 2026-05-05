import { useState, useEffect, useMemo, useRef } from 'react'
import { variants } from './engine'
import { Visualizer } from './Visualizer'
import { defaultInput, defaultTarget } from './state'
import { useLearningMode } from '@contexts/LearningModeContext'
import { ProblemLayout } from '@components/ProblemLayout'
import { InfoModal } from '@components/ui/InfoModal'
import { getStepDuration, MANUAL_STEP_DELAY } from '@/constants/timing'
import { usePersistentState } from '@hooks/usePersistentState'
import { useCameraPersistence } from '@hooks/useCameraPersistence'

export default function Problem1Page() {
    // Context
    const { capabilities, aiHooks } = useLearningMode()

    // Persistent State
    const [inputText, setInputText] = usePersistentState('DSA_1_INPUT', defaultInput)
    const [target, setTarget] = usePersistentState('DSA_1_TARGET', defaultTarget)
    const [variantId, setVariantId] = usePersistentState('DSA_1_VARIANT', 'bruteForce')
    const [showInfo, setShowInfo] = usePersistentState('DSA_1_INFO', false)
    const [showGrid, setShowGrid] = usePersistentState('DSA_1_GRID', true)
    const [speed, setSpeed] = usePersistentState('DSA_1_SPEED', 1)

    // Execution State (Persistent)
    const [currentStepIndex, setCurrentStepIndex] = usePersistentState('DSA_1_STEP', -1)
    const [isRunning, setIsRunning] = usePersistentState('DSA_1_RUNNING', false)

    // Derived State
    const [visualData, setVisualData] = useState<number[]>([])

    // Parsing
    const parseInput = (text: string) => {
        try {
            return text.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
        } catch {
            return []
        }
    }

    // Initialize (Memoized steps)
    const steps = useMemo(() => {
        const data = parseInput(inputText)
        const currentVariant = variants[variantId]
        if (currentVariant && data.length > 0) {
            return currentVariant.run(data, target)
        }
        return []
    }, [inputText, target, variantId])

    // Update visual data when input changes
    useEffect(() => {
        const data = parseInput(inputText)
        setVisualData(data)
    }, [inputText])

    // Camera Persistence
    const cameraRef = useRef<any>(null)
    useCameraPersistence('1', cameraRef)

    // Handle Input/Variant/Target Changes (Reset Logic)
    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        // Reset execution on parameter change
        setCurrentStepIndex(-1)
        setIsRunning(false)
    }, [inputText, target, variantId, setCurrentStepIndex, setIsRunning])

    // Timer with improved timing
    useEffect(() => {
        let interval: any
        if (isRunning && steps.length > 0) {
            interval = setInterval(() => {
                setCurrentStepIndex(prev => {
                    const next = prev + 1
                    const isFinalStep = next >= steps.length - 1

                    if (capabilities.autoPause) {
                        const nextStep = steps[next]
                        if (nextStep && nextStep.type === 'FOUND') {
                            setIsRunning(false)
                            return next
                        }
                    }

                    if (isFinalStep) {
                        setIsRunning(false)
                        return next
                    }

                    return next
                })
            }, getStepDuration(speed, false))
        }
        return () => clearInterval(interval)
    }, [isRunning, steps, speed, capabilities.autoPause, setCurrentStepIndex, setIsRunning])

    const handlePlay = () => {
        if (currentStepIndex >= steps.length - 1) {
            setCurrentStepIndex(-1)
        }
        setIsRunning(true)
        aiHooks.logSignal('PLAY', { variantId, speed })
    }

    const handlePause = () => {
        setIsRunning(false)
        aiHooks.logSignal('PAUSE', { stepIndex: currentStepIndex })
    }

    const handleReset = () => {
        setIsRunning(false)
        setCurrentStepIndex(-1)
        aiHooks.logSignal('RESET', {})
    }

    const handleStepNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setTimeout(() => {
                setCurrentStepIndex(prev => prev + 1)
            }, MANUAL_STEP_DELAY)
        }
    }

    const handleStepPrev = () => {
        if (currentStepIndex > 0) {
            setTimeout(() => {
                setCurrentStepIndex(prev => prev - 1)
            }, MANUAL_STEP_DELAY)
        }
    }

    const currentStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null

    return (
        <>
            <ProblemLayout
                problemId="1"
                problemTitle="Two Sum"
                onShowInfo={() => setShowInfo(true)}

                // Slots
                algorithmSelector={
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Algorithm Variant</label>
                        <select
                            value={variantId}
                            onChange={(e) => setVariantId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-100 outline-none focus:border-cyan-500 min-w-[180px]"
                        >
                            {Object.values(variants).map(v => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                }
                inputs={
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-grow">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input Array</label>
                            <input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="bg-[#1e293b] border border-slate-700 rounded p-3 font-mono text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-500 tracking-wider"
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-24 flex-shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target</label>
                            <input
                                type="number"
                                value={target}
                                onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                                className="bg-slate-900 border border-slate-700 rounded p-3 font-mono text-sm text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                }
                visualizer={
                    <Visualizer
                        visualData={visualData}
                        steps={steps}
                        currentStepIndex={currentStepIndex}
                        showGrid={showGrid}
                        hideLabels={showInfo}
                        cameraRef={cameraRef}
                    />
                }

                // Controls
                isRunning={isRunning}
                onPlay={handlePlay}
                onPause={handlePause}
                onReset={handleReset}
                onStepNext={handleStepNext}
                onStepPrev={handleStepPrev}
                speed={speed}
                onSpeedChange={setSpeed}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}

                // Data
                currentStep={currentStep}
                totalSteps={steps.length}
                currentStepIndex={currentStepIndex}
                variantId={variantId}
                code={variants[variantId]?.code}
            />

            <InfoModal
                isOpen={showInfo}
                onClose={() => setShowInfo(false)}
                problemId="1"
                title="Two Sum"
                difficulty="Easy"
                description="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice."
                inputDescription="An array of integers `nums` and an integer `target`."
                outputDescription="Indices of the two numbers such that they add up to target."
                examples={[
                    { id: 1, inputText: "nums = [2,7,11,15], target = 9", outputText: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
                    { id: 2, inputText: "nums = [3,2,4], target = 6", outputText: "[1,2]" },
                    { id: 3, inputText: "nums = [3,3], target = 6", outputText: "[0,1]" }
                ]}
                constraints={[
                    "2 <= nums.length <= 10^4",
                    "-10^9 <= nums[i] <= 10^9",
                    "-10^9 <= target <= 10^9",
                    "Only one valid answer exists."
                ]}
            />
        </>
    )
}
