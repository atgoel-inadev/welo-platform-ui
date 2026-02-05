# 🚀 BATCH UPLOAD DEMO - QUICK START

## ✅ STATUS: READY FOR DEMO

### Services Status
- ✅ **UI Server:** http://localhost:5174 (Running)
- ✅ **Auth Service:** http://localhost:3002 (Healthy)
- ✅ **Task Management:** http://localhost:3003 (Running)
- ✅ **Project Management:** http://localhost:3004 (Healthy)
- ✅ **Workflow Engine:** http://localhost:3001 (Healthy)
- ✅ **Postgres:** localhost:5432 (Healthy)
- ✅ **Kafka:** localhost:9092 (Healthy)

---

## 🎯 Quick Demo (5 Minutes)

### 1. Login
**URL:** http://localhost:5174/login
```
Email: ops@welo.com
Password: Test123!
```

### 2. Upload Batch
**Navigate to:** http://localhost:5174/ops/batches/upload

**Quick Path:**
1. Select any project from dropdown
2. Click "Add Files Manually"
3. Enter 3 files:
   ```
   File 1:
   - Name: sample1.jpg
   - Type: IMAGE
   - URL: http://localhost:5174/uploads/sample_image1.jpg
   
   File 2:
   - Name: sample2.jpg
   - Type: IMAGE
   - URL: http://localhost:5174/uploads/sample_image2.jpg
   
   File 3:
   - Name: sample1.txt
   - Type: TEXT
   - URL: http://localhost:5174/uploads/sample_text1.txt
   ```
4. Batch Name: "Quick Demo"
5. Auto-assign: ✅ Enabled
6. Click "Create Batch & Upload Files"

### 3. View Results
**Navigate to:** http://localhost:5174/ops/batches
- See your batch
- View statistics
- Check progress

---

## 📋 OR Use CSV Upload

### CSV Path
**File Location:** `c:\Workspace\wELO\welo-platform-ui\public\uploads\demo-batch.csv`

### Steps:
1. Go to: http://localhost:5174/ops/batches/upload
2. Click "Choose CSV File"
3. Select: `demo-batch.csv` from public/uploads directory
4. Configure batch:
   - Name: "Demo Batch 001"
   - Priority: 5
   - Auto-assign: ✅ Enabled
5. Submit
6. ✅ Success: 6 tasks created!

---

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Ops Manager | ops@welo.com | Test123! |
| Annotator | annotator@welo.com | Test123! |
| Reviewer | reviewer@welo.com | Test123! |
| Admin | admin@welo.com | Admin123! |

---

## 🎬 Complete Demo Flow (12 Minutes)

### Ops Manager (3 min)
1. Login: ops@welo.com
2. Create project with questions
3. Upload batch (6 files)
4. View batch statistics

### Annotator (5 min)
1. Login: annotator@welo.com
2. Go to Task Queue
3. Annotate 2-3 tasks
4. Submit responses

### Reviewer (2 min)
1. Login: reviewer@welo.com
2. Go to Review Queue
3. Review 1-2 tasks
4. Approve tasks

### Monitor Progress (2 min)
1. Login: ops@welo.com
2. View batch progress
3. See updated statistics

---

## 🐛 Troubleshooting

### UI Not Loading?
```powershell
# Check if Vite is running
# Should see: http://localhost:5174

# If not, restart:
cd c:\Workspace\wELO\welo-platform-ui
npx vite
```

### Backend Services Down?
```powershell
cd c:\Workspace\wELO\welo-platform
docker compose ps

# If services down:
docker compose up -d
```

### Files Not Loading?
- Verify files exist: `c:\Workspace\wELO\welo-platform-ui\public\uploads\`
- Check URLs use: `http://localhost:5174/uploads/`
- Clear browser cache

### Tasks Not Appearing?
```powershell
# Check logs
docker compose logs -f task-management
docker compose logs -f project-management
```

---

## 📁 Demo Files Available

**Location:** `public/uploads/`

**Images:**
- ✅ `sample_image1.jpg` - Blue image
- ✅ `sample_image2.jpg` - Green image
- ✅ `sample_image3.jpg` - Orange image

**Text:**
- ✅ `sample_text1.txt` - Positive sentiment
- ✅ `sample_text2.txt` - Mixed sentiment

**Data:**
- ✅ `sample_data.csv` - Product data
- ✅ `demo-batch.csv` - Batch import file

---

## 🎯 Success Checklist

Before Demo:
- [ ] All Docker services healthy
- [ ] UI accessible at http://localhost:5174
- [ ] Test login as ops@welo.com
- [ ] demo-batch.csv ready

During Demo:
- [ ] Batch upload works
- [ ] Tasks created successfully
- [ ] Auto-assignment functions
- [ ] Statistics display correctly

After Demo:
- [ ] All services still healthy
- [ ] No errors in console
- [ ] Data persisted correctly

---

## 📚 Documentation

**Full Guides:**
- `BATCH_UPLOAD_DEMO_GUIDE.md` - Complete demo script
- `BATCH_UPLOAD_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `DEMO_GAP_ANALYSIS.md` - Gap analysis

**Code:**
- `src/services/batchService.ts` - API client
- `src/pages/ops/BatchUpload.tsx` - Upload UI
- `src/pages/ops/BatchList.tsx` - List UI

---

## ⚡ Quick Commands

```powershell
# Check services
docker compose ps

# View logs
docker compose logs -f project-management

# Restart service
docker compose restart project-management

# Access UI
start http://localhost:5174

# Access demo files
explorer c:\Workspace\wELO\welo-platform-ui\public\uploads
```

---

## 🎉 YOU'RE READY!

**Everything is set up and working.**

**Just navigate to:** http://localhost:5174

**Login and start demoing!** 🚀

---

**Need Help?**
- Check the full demo guide: `BATCH_UPLOAD_DEMO_GUIDE.md`
- View implementation details: `BATCH_UPLOAD_IMPLEMENTATION_SUMMARY.md`
- Review gap analysis: `DEMO_GAP_ANALYSIS.md`

**Status:** ✅ PRODUCTION-READY FOR DEMO  
**Last Updated:** February 5, 2026  
**Implementation:** COMPLETE
