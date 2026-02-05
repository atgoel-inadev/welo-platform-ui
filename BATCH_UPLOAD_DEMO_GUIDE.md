# Batch Upload Demo Setup Guide

## Quick Start

### 1. Start the UI Development Server
```bash
cd c:\Workspace\wELO\welo-platform-ui
npm run dev
```

The UI will be available at: http://localhost:5173

### 2. Verify Backend Services
Ensure all backend services are running:
```bash
cd c:\Workspace\wELO\welo-platform
docker compose ps
```

Required services:
- ✅ project-management (port 3004)
- ✅ task-management (port 3002)
- ✅ auth-service (port 3001)
- ✅ postgres (port 5432)

### 3. Demo Files Ready

**Location:** `public/uploads/`

**Demo CSV:** `demo-batch.csv`
- Contains 6 sample files (3 images, 2 texts, 1 CSV)
- Pre-configured with correct file URLs

**Sample Files:**
- `sample_image1.jpg` - Blue image for classification
- `sample_image2.jpg` - Green image for object detection
- `sample_image3.jpg` - Orange image for sentiment analysis
- `sample_text1.txt` - Positive sentiment text
- `sample_text2.txt` - Mixed sentiment product review
- `sample_data.csv` - Product data for annotation

---

## Demo Flow Script

### Step 1: Login as Ops Manager (2 minutes)

1. Navigate to: http://localhost:5173/login
2. Login credentials:
   ```
   Email: ops@welo.com
   Password: Test123!
   ```
3. Verify redirect to `/ops/dashboard`

### Step 2: Create Demo Project (3 minutes)

1. Navigate to: `/ops/projects/create`
2. Fill in project details:
   ```
   Name: Image Classification Demo
   Description: Demo project for batch upload
   Customer: Select any customer
   Project Type: IMAGE_CLASSIFICATION
   Quality Threshold: 0.8
   ```

3. Add Annotation Questions:
   
   **Question 1:**
   ```
   Question: What object is in the image?
   Type: SINGLE_SELECT
   Options: Cat, Dog, Bird, Car, Building, Other
   Required: Yes
   ```

   **Question 2:**
   ```
   Question: Image Quality
   Type: RATING
   Min: 1, Max: 5
   Required: Yes
   ```

4. Configure Workflow:
   ```
   Enable Multi-Annotator: No
   Annotators per Task: 1
   Review Levels: 1
   Queue Strategy: FIFO
   ```

5. Click "Create Project"
6. Note the Project ID for next step

### Step 3: Upload Batch (3 minutes)

1. Navigate to: `/ops/batches/upload`
2. **Select Project:** Choose "Image Classification Demo"
3. **Upload CSV:**
   - Click "Choose CSV File"
   - Select: `demo-batch.csv` from Downloads or directly from `public/uploads/`
   - Wait for parsing (should show 6 files)
4. **Configure Batch:**
   ```
   Batch Name: Demo Batch 001
   Priority: 5
   Description: First demo batch with sample files
   Auto-assign: ✅ Enabled
   Assignment Method: Round Robin
   ```
5. Click "Create Batch & Upload Files"
6. Wait for success message: "6 tasks created and assigned"

### Step 4: View Batch List (1 minute)

1. Navigate to: `/ops/batches`
2. Verify batch appears in list:
   - Name: "Demo Batch 001"
   - Status: ACTIVE
   - Total: 6 tasks
   - Progress: 0%

### Step 5: Annotator Workflow (5 minutes)

1. **Logout** from ops manager
2. **Login as Annotator:**
   ```
   Email: annotator@welo.com
   Password: Test123!
   ```
3. Navigate to: `/annotate/queue`
4. Verify tasks appear (should see 3-4 tasks if round-robin worked)
5. **Click first task** to open annotation view
6. **Annotate:**
   - View image (Sample Image 1)
   - Select answer: "Building"
   - Rate quality: 5 stars
   - Click "Submit Annotation"
7. **Return to queue** - verify task is removed
8. **Annotate 1-2 more tasks**

### Step 6: Reviewer Workflow (3 minutes)

1. **Logout** from annotator
2. **Login as Reviewer:**
   ```
   Email: reviewer@welo.com
   Password: Test123!
   ```
3. Navigate to: `/review/queue`
4. Verify submitted tasks appear
5. **Click task** to review
6. **Review:**
   - View image
   - See previous annotation (from annotator)
   - Review response
   - Enter comments (optional)
   - Enter quality score: 0.95
   - Click "Approve" or "Reject"
7. Task moves to APPROVED state

### Step 7: Monitor Progress (2 minutes)

1. **Logout** from reviewer
2. **Login as Ops Manager** again
3. Navigate to: `/ops/batches`
4. View batch progress:
   ```
   Total: 6 tasks
   Completed: 1-2 tasks (approved)
   In Progress: 2-3 tasks (submitted/in annotation)
   Queued: 1-3 tasks
   Progress: 17-33%
   ```

---

## Troubleshooting

### Issue: Files not loading in FileViewer

**Solution:**
- Verify Vite dev server is running
- Check file URLs in CSV: `http://localhost:5173/uploads/filename`
- Confirm files exist in `public/uploads/` directory
- Clear browser cache

### Issue: Tasks not appearing in queues

**Check:**
1. Backend services running: `docker compose ps`
2. Tasks created: Check batch statistics
3. User roles correct: Annotator/Reviewer
4. Task status: Should be QUEUED or SUBMITTED

**Debug:**
```bash
# Check task-management logs
docker compose logs -f task-management

# Check project-management logs
docker compose logs -f project-management
```

### Issue: Auto-assignment not working

**Verify:**
1. Users exist with ANNOTATOR role
2. Users are ACTIVE status
3. `autoAssign: true` in batch creation
4. Backend logs show assignment events

**Manual Workaround:**
Use Postman to assign tasks manually:
```
POST http://localhost:3004/api/v1/batches/assign-task
Body: {
  "taskId": "task_id_here",
  "userId": "user_id_here",
  "workflowStage": "annotation"
}
```

### Issue: CSV parsing errors

**Common Causes:**
- Missing required columns: `file_name`, `file_type`, `file_url`
- Invalid file_type (must be: IMAGE, VIDEO, AUDIO, TEXT, CSV, PDF, JSON)
- Incorrect CSV encoding (use UTF-8)
- Extra quotes or special characters

**Fix:**
Download the provided `demo-batch.csv` for correct format.

---

## Test Accounts

### Ops Manager
```
Email: ops@welo.com
Password: Test123!
Role: PROJECT_MANAGER
Permissions: Create projects, upload batches, view statistics
```

### Annotator
```
Email: annotator@welo.com
Password: Test123!
Role: ANNOTATOR
Permissions: View task queue, annotate tasks, submit responses
```

### Reviewer
```
Email: reviewer@welo.com
Password: Test123!
Role: REVIEWER
Permissions: View review queue, review annotations, approve/reject
```

### Admin
```
Email: admin@welo.com
Password: Admin123!
Role: ADMIN
Permissions: All access
```

---

## API Endpoints Used

### Batch Management
```
POST   http://localhost:3004/api/v1/batches
POST   http://localhost:3004/api/v1/batches/:id/allocate-files
GET    http://localhost:3004/api/v1/batches/:id/statistics
GET    http://localhost:3004/api/v1/batches
```

### Task Management
```
GET    http://localhost:3002/tasks
GET    http://localhost:3002/tasks/:id/render-config
POST   http://localhost:3002/tasks/:id/annotation
POST   http://localhost:3002/tasks/:id/review
```

### Authentication
```
POST   http://localhost:3001/api/v1/auth/login
GET    http://localhost:3001/api/v1/auth/me
```

---

## Expected Demo Results

### After Complete Flow:
- ✅ 1 Project created
- ✅ 1 Batch created (6 tasks)
- ✅ 6 Tasks distributed to annotators
- ✅ 2-3 Tasks annotated
- ✅ 1-2 Tasks reviewed and approved
- ✅ Progress tracking working
- ✅ State transitions visible

### Success Metrics:
- Batch upload time: < 5 seconds
- Task creation: 6 tasks in < 2 seconds
- Auto-assignment: All tasks assigned immediately
- Annotation time: < 1 minute per task
- Review time: < 30 seconds per task

---

## Next Steps After Demo

### Immediate (Week 1):
1. Implement BatchDetails page (view tasks, statistics)
2. Add user management UI
3. Implement manual task assignment
4. Add task filtering and search

### Short Term (Week 2-3):
1. File upload handling (multer + storage)
2. Batch completion workflow
3. Export functionality
4. Enhanced statistics dashboard

### Medium Term (Month 1):
1. Skill-based assignment
2. Quality metrics visualization
3. Performance analytics
4. Bulk operations

---

## Files Modified

### New Files Created:
1. `src/services/batchService.ts` - Batch API client
2. `src/pages/ops/BatchUpload.tsx` - Batch upload UI
3. `src/pages/ops/BatchList.tsx` - Batch list UI
4. `public/uploads/demo-batch.csv` - Demo CSV
5. `public/uploads/sample_image1.jpg` - Demo image 1
6. `public/uploads/sample_image2.jpg` - Demo image 2
7. `public/uploads/sample_image3.jpg` - Demo image 3
8. `public/uploads/sample_text1.txt` - Demo text 1
9. `public/uploads/sample_text2.txt` - Demo text 2
10. `public/uploads/sample_data.csv` - Demo CSV data

### Modified Files:
1. `src/App.tsx` - Added batch routes
2. `src/components/Layout.tsx` - Navigation already includes Batches

---

## Support

For issues during demo:
1. Check browser console for errors
2. Check backend logs: `docker compose logs -f`
3. Verify all services running: `docker compose ps`
4. Restart services if needed: `docker compose restart project-management`

**Emergency Reset:**
```bash
# Reset database (WARNING: Deletes all data)
docker compose down
docker volume rm welo-platform_postgres_data
docker compose up -d
```

---

**Status:** ✅ Ready for Demo  
**Implementation Time:** 3.5 hours  
**Last Updated:** February 5, 2026
