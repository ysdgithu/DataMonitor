/**
 * 告警音频通知工具
 * 使用 Web Audio API 生成告警提示音
 */

class AudioNotification {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // 延迟初始化 AudioContext (需要用户交互后才能创建)
    this.init()
  }

  /**
   * 初始化 AudioContext
   */
  private init() {
    try {
      // 检查浏览器支持
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
      }
    } catch (error) {
      console.warn('[AudioNotification] 音频初始化失败:', error)
      this.enabled = false
    }
  }

  /**
   * 播放告警提示音
   * 使用简单的双音符(440Hz + 554Hz)
   */
  playAlarmSound() {
    if (!this.enabled || !this.audioContext) {
      console.log('[AudioNotification] 音频未启用或不支持')
      return
    }

    try {
      // 恢复 AudioContext (如果处于 suspended 状态)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      const now = this.audioContext.currentTime

      // 创建两个振荡器(双音符)
      const oscillator1 = this.audioContext.createOscillator()
      const oscillator2 = this.audioContext.createOscillator()
      
      // 创建增益节点控制音量
      const gainNode = this.audioContext.createGain()

      // 设置频率 (A4 = 440Hz, C#5 = 554Hz)
      oscillator1.frequency.value = 440
      oscillator2.frequency.value = 554
      oscillator1.type = 'sine'
      oscillator2.type = 'sine'

      // 连接节点
      oscillator1.connect(gainNode)
      oscillator2.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // 音量包络 (淡入淡出)
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)  // 淡入
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15)  // 持续
      gainNode.gain.linearRampToValueAtTime(0, now + 0.25)    // 淡出

      // 播放
      oscillator1.start(now)
      oscillator2.start(now)
      oscillator1.stop(now + 0.25)
      oscillator2.stop(now + 0.25)

      console.log('[AudioNotification] 播放告警提示音')
    } catch (error) {
      console.error('[AudioNotification] 播放失败:', error)
    }
  }

  /**
   * 播放成功提示音
   */
  playSuccessSound() {
    if (!this.enabled || !this.audioContext) return

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      const now = this.audioContext.currentTime
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.frequency.value = 523.25 // C5
      oscillator.type = 'sine'
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15)

      oscillator.start(now)
      oscillator.stop(now + 0.15)
    } catch (error) {
      console.error('[AudioNotification] 播放失败:', error)
    }
  }

  /**
   * 启用/禁用音频通知
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    console.log(`[AudioNotification] 音频通知已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 获取当前启用状态
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// 导出单例
export const audioNotification = new AudioNotification()

