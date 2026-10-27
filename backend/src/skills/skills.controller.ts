import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto, CreateSkillSessionDto } from './dto';

@ApiTags('skills')
@Controller('api/skills')
export class SkillsController {
  constructor(private skills: SkillsService) {}

  @Get()
  list() {
    return this.skills.list();
  }

  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.skills.detail(id);
  }

  @Post(':id/sessions')
  addSession(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSkillSessionDto) {
    return this.skills.addSession(id, dto.date, dto.minutes, dto.note);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  removeSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.skills.removeSession(sessionId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skills.remove(id);
  }
}
