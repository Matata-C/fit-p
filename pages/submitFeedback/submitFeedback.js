// pages/submitFeedback/submitFeedback.js
Page({
  data: {
    selectedType: '', 
    descContent: '', 
    descLength: 0, 
    uploadImages: [], 
    contactInfo: '', 
  },

  // 选择问题类型
  handleTypeSelect(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedType: type
    });
  },

  // 输入问题描述
  handleDescInput(e) {
    const value = e.detail.value;
    this.setData({
      descContent: value,
      descLength: value.length
    });
  },

  // 选择图片
  handleChooseImage() {
    wx.chooseImage({
      count: 3, 
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          uploadImages: this.data.uploadImages.concat(res.tempFilePaths)
        });
      }
    });
  },

  // 删除图片
  handleDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newImages = this.data.uploadImages.filter((_, i) => i !== index);
    this.setData({
      uploadImages: newImages
    });
  },

  // 输入联系方式
  handleContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  // 提交反馈
  handleSubmit() {
    const { selectedType, descContent, uploadImages, contactInfo } = this.data;
    if (!selectedType) {
      wx.showToast({
        title: '请选择问题类型',
        icon: 'none'
      });
      return;
    }
    if (descContent.length === 0) {
      wx.showToast({
        title: '请填写问题描述',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '提交成功',
      icon: 'success'
    });
  }
});